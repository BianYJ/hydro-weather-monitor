"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type CloudData = {
  positions: Float32Array;
  colors: Float32Array;
  count: number;
  sourceCount: number;
  format: string;
};

const MAX_RENDER_POINTS = 800_000;

function colorForHeight(value: number, min: number, max: number) {
  const t = max === min ? 0.5 : (value - min) / (max - min);
  const color = new THREE.Color();
  color.setHSL(0.56 - t * 0.48, 0.82, 0.58);
  return color;
}

function centerPositions(raw: Float64Array, count: number) {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < count; i += 1) {
    const x = raw[i * 3];
    const y = raw[i * 3 + 1];
    const z = raw[i * 3 + 2];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 1);
  const scale = 12 / span;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (raw[i * 3] - centerX) * scale;
    positions[i * 3 + 1] = (raw[i * 3 + 2] - centerZ) * scale;
    positions[i * 3 + 2] = -(raw[i * 3 + 1] - centerY) * scale;
  }

  return { positions, minZ, maxZ };
}

function parseXyz(text: string): CloudData {
  const lines = text.split(/\r?\n/);
  const sourceCount = lines.length;
  const stride = Math.max(1, Math.ceil(lines.length / MAX_RENDER_POINTS));
  const coordinates: number[] = [];
  const inputColors: number[] = [];
  let hasRgb = false;

  for (let index = 0; index < lines.length; index += stride) {
    const line = lines[index].trim();
    if (!line || line.startsWith("#") || line.startsWith("//")) continue;
    const values = line.split(/[\s,;]+/).map(Number);
    if (values.length < 3 || values.slice(0, 3).some((value) => !Number.isFinite(value))) continue;
    coordinates.push(values[0], values[1], values[2]);
    if (values.length >= 6 && values.slice(3, 6).every(Number.isFinite)) {
      const divisor = Math.max(values[3], values[4], values[5]) > 1 ? 255 : 1;
      inputColors.push(values[3] / divisor, values[4] / divisor, values[5] / divisor);
      hasRgb = true;
    } else {
      inputColors.push(0, 0, 0);
    }
  }

  const count = coordinates.length / 3;
  if (!count) throw new Error("未在文件中识别到有效的 XYZ 点坐标");
  const raw = Float64Array.from(coordinates);
  const { positions, minZ, maxZ } = centerPositions(raw, count);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    if (hasRgb && inputColors[i * 3] + inputColors[i * 3 + 1] + inputColors[i * 3 + 2] > 0) {
      colors[i * 3] = inputColors[i * 3];
      colors[i * 3 + 1] = inputColors[i * 3 + 1];
      colors[i * 3 + 2] = inputColors[i * 3 + 2];
    } else {
      const color = colorForHeight(raw[i * 3 + 2], minZ, maxZ);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
  }

  return { positions, colors, count, sourceCount, format: "XYZ" };
}

function parseLas(buffer: ArrayBuffer): CloudData {
  const view = new DataView(buffer);
  if (buffer.byteLength < 227 || String.fromCharCode(...new Uint8Array(buffer, 0, 4)) !== "LASF") {
    throw new Error("文件不是有效的 LAS 点云");
  }

  const pointDataOffset = view.getUint32(96, true);
  const pointFormat = view.getUint8(104) & 0x3f;
  const recordLength = view.getUint16(105, true);
  let sourceCount = view.getUint32(107, true);
  if (!sourceCount && buffer.byteLength >= 255 && typeof view.getBigUint64 === "function") {
    sourceCount = Number(view.getBigUint64(247, true));
  }
  const availableCount = Math.max(0, Math.floor((buffer.byteLength - pointDataOffset) / recordLength));
  sourceCount = Math.min(sourceCount || availableCount, availableCount);
  if (!sourceCount || recordLength < 20) throw new Error("LAS 文件中没有可读取的点记录");

  const scaleX = view.getFloat64(131, true);
  const scaleY = view.getFloat64(139, true);
  const scaleZ = view.getFloat64(147, true);
  const offsetX = view.getFloat64(155, true);
  const offsetY = view.getFloat64(163, true);
  const offsetZ = view.getFloat64(171, true);
  const stride = Math.max(1, Math.ceil(sourceCount / MAX_RENDER_POINTS));
  const count = Math.ceil(sourceCount / stride);
  const raw = new Float64Array(count * 3);
  const rgb = new Float32Array(count * 3);
  const rgbOffset = pointFormat === 2 ? 20 : pointFormat === 3 || pointFormat === 5 ? 28 : pointFormat === 7 || pointFormat === 8 || pointFormat === 10 ? 30 : -1;
  let hasRgb = false;
  let outputIndex = 0;

  for (let sourceIndex = 0; sourceIndex < sourceCount; sourceIndex += stride) {
    const start = pointDataOffset + sourceIndex * recordLength;
    raw[outputIndex * 3] = view.getInt32(start, true) * scaleX + offsetX;
    raw[outputIndex * 3 + 1] = view.getInt32(start + 4, true) * scaleY + offsetY;
    raw[outputIndex * 3 + 2] = view.getInt32(start + 8, true) * scaleZ + offsetZ;
    if (rgbOffset >= 0 && rgbOffset + 6 <= recordLength) {
      const red = view.getUint16(start + rgbOffset, true);
      const green = view.getUint16(start + rgbOffset + 2, true);
      const blue = view.getUint16(start + rgbOffset + 4, true);
      const divisor = Math.max(red, green, blue) > 255 ? 65535 : 255;
      rgb[outputIndex * 3] = red / divisor;
      rgb[outputIndex * 3 + 1] = green / divisor;
      rgb[outputIndex * 3 + 2] = blue / divisor;
      hasRgb ||= red + green + blue > 0;
    }
    outputIndex += 1;
  }

  const { positions, minZ, maxZ } = centerPositions(raw, outputIndex);
  const colors = new Float32Array(outputIndex * 3);
  for (let i = 0; i < outputIndex; i += 1) {
    if (hasRgb) {
      colors[i * 3] = rgb[i * 3];
      colors[i * 3 + 1] = rgb[i * 3 + 1];
      colors[i * 3 + 2] = rgb[i * 3 + 2];
    } else {
      const color = colorForHeight(raw[i * 3 + 2], minZ, maxZ);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
  }

  return {
    positions,
    colors,
    count: outputIndex,
    sourceCount,
    format: `LAS · 点格式 ${pointFormat}`,
  };
}

export default function PointCloudViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const materialRef = useRef<THREE.PointsMaterial | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [cloud, setCloud] = useState<CloudData | null>(null);
  const [fileName, setFileName] = useState("");
  const [pointSize, setPointSize] = useState(2.2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#061321");
    scene.fog = new THREE.FogExp2("#061321", 0.035);
    const camera = new THREE.PerspectiveCamera(48, 1, 0.01, 1000);
    camera.position.set(10, 8, 12);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    } catch {
      const errorTimer = window.setTimeout(
        () => setError("当前浏览器未启用 WebGL，无法显示三维点云。请开启硬件加速后重试。"),
        0,
      );
      return () => window.clearTimeout(errorTimer);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    controls.target.set(0, 0, 0);
    const grid = new THREE.GridHelper(20, 20, "#1c6d78", "#123a4c");
    grid.position.y = -6.2;
    scene.add(grid);
    scene.add(new THREE.AxesHelper(2.4));

    const resize = () => {
      const rect = host.getBoundingClientRect();
      camera.aspect = Math.max(rect.width, 1) / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(Math.max(rect.width, 1), Math.max(rect.height, 1), false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    let frame = 0;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    resize();
    animate();
    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !cloud) return;
    if (pointsRef.current) {
      scene.remove(pointsRef.current);
      pointsRef.current.geometry.dispose();
      materialRef.current?.dispose();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(cloud.positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(cloud.colors, 3));
    geometry.computeBoundingSphere();
    const material = new THREE.PointsMaterial({
      size: pointSize / 36,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.96,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    pointsRef.current = points;
    materialRef.current = material;
  }, [cloud, pointSize]);

  function resetView() {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(10, 8, 12);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    setFileName(file.name);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const data = extension === "las" ? parseLas(await file.arrayBuffer()) : parseXyz(await file.text());
      setCloud(data);
      window.setTimeout(resetView, 0);
    } catch (caught) {
      setCloud(null);
      setError(caught instanceof Error ? caught.message : "点云文件解析失败");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="viewer-layout">
      <aside className="viewer-sidebar">
        <div>
          <p className="eyebrow">POINT CLOUD</p>
          <h2>三维点云查看</h2>
          <p className="viewer-description">本地解析 LAS、XYZ 点云，支持旋转、缩放、平移和点径调整。</p>
        </div>
        <label className="upload-button">
          <input type="file" accept=".las,.xyz,text/plain" onChange={selectFile} />
          <span>＋</span> 上传点云文件
        </label>
        <div className="file-note">支持未压缩 LAS 与 XYZ 文本，单次最多渲染 80 万点。</div>
        {fileName && (
          <div className="file-card">
            <span>当前文件</span>
            <strong title={fileName}>{fileName}</strong>
            {cloud && <small>{cloud.format} · 显示 {cloud.count.toLocaleString()} / {cloud.sourceCount.toLocaleString()} 点</small>}
          </div>
        )}
        <label className="range-control">
          <span>点云粗细 <strong>{pointSize.toFixed(1)}</strong></span>
          <input type="range" min="0.8" max="8" step="0.2" value={pointSize} onChange={(event) => setPointSize(Number(event.target.value))} />
        </label>
        <button className="secondary-button" onClick={resetView}>复位视角</button>
        <div className="viewer-help">
          <span>左键拖动：旋转</span>
          <span>滚轮：放大 / 缩小</span>
          <span>右键拖动：平移</span>
        </div>
      </aside>
      <section className="viewer-canvas-wrap">
        <div ref={hostRef} className="point-cloud-canvas" />
        {!cloud && !loading && (
          <div className="viewer-empty">
            <span className="empty-graphic">⌁</span>
            <strong>上传 LAS 或 XYZ 文件开始查看</strong>
            <small>文件仅在当前浏览器中处理，不会上传服务器</small>
          </div>
        )}
        {loading && <div className="viewer-loading">正在解析点云数据…</div>}
        {error && <div className="viewer-error">{error}</div>}
      </section>
    </div>
  );
}
