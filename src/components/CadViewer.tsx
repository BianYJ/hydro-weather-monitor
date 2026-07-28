"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import type { App as VueApplication } from "vue";

export default function CadViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !file) return;
    const selectedFile = file;
    let active = true;
    let vueApp: VueApplication<Element> | null = null;
    host.replaceChildren();
    setStatus("loading");
    setMessage("正在初始化 DWG 解析引擎…");

    async function mountViewer() {
      try {
        const [{ createApp, h }, cadViewer, elementPlus] = await Promise.all([
          import("vue"),
          import("@mlightcad/cad-viewer"),
          import("element-plus"),
        ]);
        if (!active || !host) return;
        vueApp = createApp({
          render: () =>
            h(cadViewer.MlCadViewer, {
              localFile: selectedFile,
              locale: "zh",
              theme: "dark",
              background: 0x061321,
              useMainThreadDraw: false,
            }),
        });
        vueApp.use(cadViewer.i18n);
        vueApp.use(elementPlus.default);
        vueApp.mount(host);
        setStatus("ready");
        setMessage("");
      } catch (caught) {
        if (!active) return;
        setStatus("error");
        setMessage(caught instanceof Error ? caught.message : "CAD 查看器初始化失败");
      }
    }

    mountViewer();
    return () => {
      active = false;
      vueApp?.unmount();
      host.replaceChildren();
    };
  }, [file]);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    event.target.value = "";
  }

  return (
    <div className="viewer-layout">
      <aside className="viewer-sidebar">
        <div>
          <p className="eyebrow">CAD WORKSPACE</p>
          <h2>CAD 文件查看</h2>
          <p className="viewer-description">浏览器本地解析 DWG，支持缩放、平移、图层与实体查看。</p>
        </div>
        <label className="upload-button">
          <input type="file" accept=".dwg,application/acad,application/x-acad" onChange={selectFile} />
          <span>＋</span> 上传 DWG 文件
        </label>
        <div className="file-note">推荐使用 AutoCAD 2000—2018 版本 DWG；大型图纸首次解析需要一定时间。</div>
        {file && (
          <div className="file-card">
            <span>当前文件</span>
            <strong title={file.name}>{file.name}</strong>
            <small>{(file.size / 1024 / 1024).toFixed(2)} MB · DWG</small>
          </div>
        )}
        <div className="viewer-help">
          <span>滚轮：缩放图纸</span>
          <span>中键 / 工具栏：平移</span>
          <span>图层面板：显示与隐藏</span>
        </div>
        <div className="privacy-note"><i /> DWG 在本机解析，不上传服务器</div>
      </aside>
      <section className="viewer-canvas-wrap cad-stage">
        <div ref={hostRef} className="cad-host" />
        {!file && (
          <div className="viewer-empty">
            <span className="empty-graphic cad">⌗</span>
            <strong>上传 DWG 文件开始查看</strong>
            <small>WebAssembly 解析引擎将在浏览器内加载图纸</small>
          </div>
        )}
        {status === "loading" && <div className="viewer-loading">{message}</div>}
        {status === "error" && <div className="viewer-error">{message}</div>}
      </section>
    </div>
  );
}
