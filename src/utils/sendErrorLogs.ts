import { postToHaste } from "./postToHaste.js";
import util from "node:util";

/**
 * Send error log to the provided Discord webhook using fetch and APIEmbed structure.
 */
export async function sendErrorLog(errorId: string, webhookUrl: string, content: any, err?: any) {
  const error = err instanceof Error ? err.stack : content.stack || content;
  const embed = {
    color: 0x3498db, // Blue
    author: { name: err?.name ?? "Error" },
    description: `\`\`\`js\n${error.toString().substring(0, 4000)}\n\`\`\``,
    fields: [
      {
        name: "Description",
        value: content?.message || content || err?.message || "NA",
      },
    ],
  };

  const fullErr = await postToHaste(util.inspect(err instanceof Error ? err : content, { depth: null })).catch(() => {});

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Error Log",
      embeds: [embed],
      content: `Error ID: ${errorId}\n${fullErr}`,
    }),
  }).catch(() => {});
}
