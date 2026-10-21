// Week2：可切换人设的 CLI 对话工具
// 用法：node persona.mjs <人设名>，或 npm run persona -- <人设名>

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { chatStream } from "./api.mjs";
import { personas } from "./personas.mjs";
import { loadHistory, saveHistory } from "./history.mjs";

if (!process.env.DEEPSEEK_API_KEY) {
  console.error("❌ 没读到 DEEPSEEK_API_KEY");
  process.exit(1);
}

const personaName = process.argv[2] ?? "interviewer";
const systemPrompt = personas[personaName];
if (!systemPrompt) {
  console.error(`❌ 未知人设：${personaName}`);
  console.error(`可用人设：${Object.keys(personas).join(", ")}`);
  process.exit(1);
}

// 恢复历史：只存 user / assistant，system 每次用当前人设重新拼
const history = await loadHistory(personaName);
const messages = [{ role: "system", content: systemPrompt }, ...history];

const rl = readline.createInterface({ input: stdin, output: stdout });
console.log(
  `人设：${personaName}，已恢复 ${history.length} 条历史，输入 exit 退出。\n`,
);

while (true) {
  const input = (await rl.question("你: ")).trim();
  if (input.toLowerCase() === "exit") break;
  if (!input) continue;

  messages.push({ role: "user", content: input });
  process.stdout.write("AI: ");
  try {
    const reply = await chatStream(messages);
    console.log("\n");
    messages.push({ role: "assistant", content: reply });
    await saveHistory(personaName, messages.slice(1)); // slice(1) 去掉 system
  } catch (err) {
    console.log(`\n❌ ${err.message}`);
    messages.pop(); // 回滚这条失败的 user 消息
  }
}

rl.close();
