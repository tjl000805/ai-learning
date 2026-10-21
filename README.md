# ai-learning

AI 应用开发学习项目（14 周计划），Node.js 技术栈，目标岗位：**AI 应用开发工程师**。

不训练模型，专注用工程能力把大模型做成产品。

## 技术栈

- Node.js（ESM）+ 原生 `fetch`
- DeepSeek API（`deepseek-chat`）
- 后续：TypeScript / Next.js / Function Calling / RAG / Agent

## 目录结构

```
week1/                 Week1：打通 API 调用
  hello.mjs            首次调用 + temperature 对比
  stream.mjs           流式输出（SSE）
  multi-turn.mjs       多轮对话（维护 messages 历史）
  chat.mjs             命令行 AI 对话工具（流式 + 多轮）
week2/                 Week2：巩固 API 能力
  api.mjs              DeepSeek 调用 + 错误处理（可复用模块）
  personas.mjs         人设 system prompt 数据
  history.mjs          对话历史读写（本地 JSON，按人设隔离）
  persona.mjs          可切换人设的 CLI 对话工具
  data/                本地对话历史（gitignored）
week3/                 Week3：后端 + Next.js
  server.mjs           Express 服务：GET /hello、POST /chat、错误处理
  web/                 Next.js App Router 应用（TypeScript + Tailwind）
    src/app/page.tsx              流式对话 UI（多轮气泡、自动滚动）
    src/app/api/chat/route.ts     POST /api/chat：校验 + 调用 DeepSeek + SSE 转纯文本流
```

## 环境要求

- Node.js 18+（需要内置 `fetch`）
- DeepSeek API Key

## 运行

PowerShell：

在项目根目录创建 `.env`（CLI 用），并在 `week3/web/` 下创建 `.env.local`（Next 服务端用）。两者都已被 .gitignore 排除：

```
DEEPSEEK_API_KEY=你的 DeepSeek API Key
```

```powershell
# 推荐：npm scripts 会自动加载 .env
npm run chat
npm run persona -- interviewer     # 人设：interviewer / reviewer / tutor

# 或直接运行（需要自己带上 --env-file-if-exists）
node --env-file-if-exists=.env week1/chat.mjs
node --env-file-if-exists=.env week2/persona.mjs interviewer

# Next.js 网页（另开一个终端）
cd week3/web
npm run dev -- -p 3001     # 打开 http://localhost:3001
```

两个工具都输入 `exit` 退出。

## 学习进度

- [x] Week1：API 调用、流式输出、多轮对话、CLI 对话工具
- [x] Week2：system prompt 人设、错误处理（超时 / 401 / 429 / 5xx）
- [x] 模块拆分：npm 初始化 + `api.mjs` / `personas.mjs` / `persona.mjs`
- [x] 历史持久化：按人设保存到本地 JSON，重启可恢复
- [x] Week3 起步：Express（GET / POST / 错误处理）+ Next.js 页面
- [x] Route Handler `POST /api/chat` 调 DeepSeek + 多轮对话
- [x] 流式对话 UI（SSE 转文本流）+ Tailwind 界面
- [ ] 下一步：部署 Vercel，产出线上可访问的 AI 聊天网页
