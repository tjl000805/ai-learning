// 历史记录持久化：每个人设一个 JSON 文件，只存 user / assistant 消息
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = fileURLToPath(new URL("./data/", import.meta.url));

function fileFor(persona) {
  return path.join(DATA_DIR, `${persona}.json`);
}

export async function loadHistory(persona) {
  // TODO 1：读取 fileFor(persona)，返回解析后的数组
  // - 文件不存在：err.code === "ENOENT" → 返回 []
  // - JSON 解析失败：提示"历史文件损坏，已忽略" → 返回 []
  // - 两种情况都不能让进程崩溃
  // TODO 1 的核心结构
  try {
    const raw = await readFile(fileFor(persona), "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return []; // 第一次运行，文件还不存在
    console.warn("⚠️ 历史文件损坏，已忽略");
    return [];
  }
}

export async function saveHistory(persona, messages) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(fileFor(persona), JSON.stringify(messages, null, 2));
}
