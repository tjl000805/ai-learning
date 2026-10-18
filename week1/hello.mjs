// Week1 Day1：第一次调用大模型 API
// 运行方式见同目录 README，或直接看命令行提示

const API_KEY = process.env.DEEPSEEK_API_KEY;

if (!API_KEY) {
  console.error("❌ 没读到 DEEPSEEK_API_KEY，请先在终端设置环境变量");
  process.exit(1);
}
const messages = [
  { role: "system", content: "你是一个随机数生成器" },
  { role: "user", content: "随机说一个 1 到 100 之间的整数，只输出数字，不要任何其他内容" },
];

async function chat(messages, { model = "deepseek-chat", temperature = 1 } = {}) {
  // TODO 1：发 POST 请求
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
    }),
  });
  const data = await res.json();
  // TODO 2：res.ok 为 false 时，throw 一个带 状态码 + 返回内容的 Error
  if (!res.ok) {
    throw new Error(`API 请求失败 (${res.status}): ${JSON.stringify(data)}`);
  }
  // TODO 3：成功则返回 data.choices[0].message.content
  // console.log("✅ 模型回复：", data.choices[0].message.content);
  return data.choices[0].message.content
}

for (const t of [0, 1.5]) {
  console.log(`\n--- temperature ${t} ---`);
  for (let i = 0; i < 5; i++) {
    console.log(await chat(messages, { temperature: t }));
  }
}
