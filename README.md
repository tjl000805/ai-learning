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
  persona.mjs          可切换人设的 CLI 对话工具
```

## 环境要求

- Node.js 18+（需要内置 `fetch`）
- DeepSeek API Key

## 运行

PowerShell：

在项目根目录创建 `.env`（已被 .gitignore 排除，不会提交）：

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
```

两个工具都输入 `exit` 退出。

## 学习进度

- [x] Week1：API 调用、流式输出、多轮对话、CLI 对话工具
- [x] Week2：system prompt 人设、错误处理（超时 / 401 / 429 / 5xx）
- [x] 模块拆分：npm 初始化 + `api.mjs` / `personas.mjs` / `persona.mjs`
- [ ] 下一步：历史记录持久化、TypeScript
