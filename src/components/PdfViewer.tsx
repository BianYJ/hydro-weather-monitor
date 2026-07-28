"use client";

import { ChangeEvent, useEffect, useState } from "react";

export default function PdfViewer() {
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (url) URL.revokeObjectURL(url);
    setUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setFileSize(file.size);
    event.target.value = "";
  }

  return (
    <div className="viewer-layout">
      <aside className="viewer-sidebar">
        <div>
          <p className="eyebrow">DOCUMENT VIEWER</p>
          <h2>PDF 文件查看</h2>
          <p className="viewer-description">上传本地 PDF，在浏览器中翻页、缩放、搜索和打印。</p>
        </div>
        <label className="upload-button">
          <input type="file" accept=".pdf,application/pdf" onChange={selectFile} />
          <span>＋</span> 上传 PDF 文件
        </label>
        <div className="file-note">文件仅在当前浏览器打开，不会上传到服务器。</div>
        {fileName && (
          <div className="file-card">
            <span>当前文件</span>
            <strong title={fileName}>{fileName}</strong>
            <small>{(fileSize / 1024 / 1024).toFixed(2)} MB · PDF</small>
          </div>
        )}
        {url && (
          <a className="secondary-button link-button" href={url} target="_blank" rel="noreferrer">
            在新窗口打开
          </a>
        )}
      </aside>
      <section className="viewer-canvas-wrap pdf-stage">
        {url ? (
          <iframe className="pdf-frame" src={`${url}#view=FitH`} title={`PDF 在线查看：${fileName}`} />
        ) : (
          <div className="viewer-empty">
            <span className="empty-graphic pdf">PDF</span>
            <strong>上传 PDF 文件开始查看</strong>
            <small>支持浏览器自带的翻页、缩放、搜索与打印功能</small>
          </div>
        )}
      </section>
    </div>
  );
}
