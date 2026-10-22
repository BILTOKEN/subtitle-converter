# Subtitle Converter

纯前端的字幕格式转换站：SRT ↔ TXT、SRT ↔ VTT、LRC ↔ SRT。所有转换都在浏览器里完成，不上传文件，没有后端。

## 页面

| 路径 | 目标关键词 |
|---|---|
| `/` | subtitle converter（自动识别格式） |
| `/srt-to-txt` | srt to txt |
| `/txt-to-srt` | txt to srt / text to srt |
| `/srt-to-vtt` | srt to vtt |
| `/vtt-to-srt` | vtt to srt |
| `/lrc-to-srt` | lrc to srt |
| `/srt-to-lrc` | srt to lrc |

## 结构

- `src/converter.js`：转换核心（解析 + 输出），浏览器和 Node 共用
- `src/app.js`：页面交互（粘贴、上传、拖拽、选项、下载、复制）
- `src/pages.mjs`：每个页面的标题、描述、正文和 FAQ（改文案改这里）
- `src/template.mjs`：HTML 模板
- `scripts/build.mjs`：生成静态站到 `dist/`，含 `sitemap.xml` 和 `robots.txt`
- `test/converter.test.mjs`：单元测试

## 命令

```bash
npm test        # 跑测试
npm run dev     # 构建并在 http://localhost:8080 预览
```

## 部署（Vercel）

`vercel.json` 已配置好，导入仓库直接 Deploy，不用改任何设置。

可选环境变量：

- `SITE_URL`：网站正式地址，例如 `https://example.com`。不填时自动用 Vercel 的正式域名。
- `GOOGLE_SITE_VERIFICATION`：Google Search Console「HTML 标记」验证方式里 `content="..."` 的值。
- `BING_SITE_VERIFICATION`：Bing 的 `msvalidate.01` 验证值。

改了环境变量后要重新部署一次才会生效。

## 改网站名字

把 `src/pages.mjs` 里的 `SITE_NAME` 改成新名字即可。
