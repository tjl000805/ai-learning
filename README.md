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
  hello.mjs            Day1 首次调用 + temperature 对比
  stream.mjs           Day4 流式输出（SSE）
  multi-turn.mjs       Day5 多轮对话（维护 messages 历史）
  chat.mjs             Day6 命令行 AI 对话工具（流式 + 多轮）
```

## 环境要求

- Node.js 18+（需要内置 `fetch`）
- DeepSeek API Key

## 运行

PowerShell：

```powershell
$env:DEEPSEEK_API_KEY = "你的 DeepSeek API Key"
node week1/chat.mjs
```

`chat.mjs` 支持连续对话和逐字流式输出，输入 `exit` 退出。

## 学习进度

- [x] Week1 Day1-6：API 调用、流式输出、多轮对话、CLI 对话工具
- [ ] Week1 Day7：复盘 + 仓库整理
- [ ] Week2：错误处理、模块拆分、TypeScript
