// Week3：Express 后端 —— GET /hello、POST /chat、错误处理
import express from "express";

const app = express();
const PORT = 3000;

// 中间件：把请求体里的 JSON 解析成 req.body
app.use(express.json());

app.get("/hello", (req, res) => {
  res.json({ message: "Hello from Express", time: new Date().toISOString() });
});

// 接收问题并返回答案（目前是占位，后续接大模型）
app.post("/chat", (req, res) => {
  const { question } = req.body ?? {};

  if (typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "question 必须是非空字符串" });
  }

  res.json({ question, answer: `收到问题：${question}` });
});

// 未匹配任何路由：返回 JSON 404，而不是 Express 默认的 HTML
app.use((req, res) => {
  res.status(404).json({ error: "接口不存在" });
});

// 统一错误处理中间件：必须 4 个参数，放最后
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "请求体不是合法 JSON" });
  }
  console.error(err);
  res.status(500).json({ error: "服务器内部错误" });
});

app.listen(PORT, () => {
  console.log(`服务已启动：http://localhost:${PORT}`);
});
