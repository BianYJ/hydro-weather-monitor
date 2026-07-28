# 水文气象实时监测平台

适用于 GitHub 仓库连接 Cloudflare Pages 的静态前端项目。

## 已包含功能

- 城市实时天气查询
- 水位、潮位和水文态势界面
- LAS、XYZ 三维点云本地上传与在线查看
- DWG 文件本地上传与在线查看
- PDF 文件本地上传与在线查看
- 桌面端和手机端响应式界面

## Cloudflare Pages 构建设置

- Framework preset：`Vite`
- Build command：`npm run build`
- Build output directory：`dist`
- Root directory：留空
- Node.js version：建议 `22`

## 上传说明

将本项目中的全部文件和文件夹上传到 GitHub 仓库根目录。不要把 ZIP
压缩包直接放进仓库，也不要上传 `node_modules`。

GitHub 提交完成后，Cloudflare Pages 会自动拉取代码并构建发布。
