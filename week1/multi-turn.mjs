// Week1 Day5：多轮对话 —— 模型没有记忆，靠我们自己维护 messages 历史

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const API_KEY = process.env.DEEPSEEK_API_KEY;
if (!API_KEY) {
  console.error("❌ 没读到 DEEPSEEK_API_KEY");
  process.exit(1);
}

// 这个数组就是"记忆"：每一轮都往里追加，然后整个发给模型
const messages = [
  { role: "system", content: "你是一个简洁的中文助手，回答尽量简短" },
];

async function chat(history) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: history,
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`API 请求失败 (${res.status}): ${JSON.stringify(data)}`);
  }
  return data.choices[0].message.content;
}

const rl = readline.createInterface({ input: stdin, output: stdout });

console.log("多轮对话已启动，输入 exit 退出。");
console.log("试试：先说“我叫田金龙，记住”，再问“我叫什么名字？”\n");

while (true) {
  const userInput = await rl.question("你: ");
  if (userInput.trim().toLowerCase() === "exit") break;

  // 1. 把用户这句加进历史
  messages.push({ role: "user", content: userInput });

  // 2. 把完整历史发出去（不是只发这一句）
  const reply = await chat(messages);
  console.log(`AI: ${reply}\n`);

  // 3. 把模型回复也加进历史，下一轮它才知道自己说过什么
  messages.push({ role: "assistant", content: reply });
}

rl.close();
