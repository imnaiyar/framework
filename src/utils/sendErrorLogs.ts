import { codeBlock, EmbedBuilder, WebhookClient } from "discord.js";
import { postToHaste } from "./postToHaste.js";
import util from "node:util";
/**
 * Send error log to the provided discord webhook
 */
export async function sendErrorLog(errorId: string, webhookUrl: string, content: any, err?: any) {
  const webhookLogger = new WebhookClient({ url: webhookUrl });
  const error = err instanceof Error ? err.stack : content.stack || content;
  const embed = new EmbedBuilder().setColor("Blue").setAuthor({ name: err?.name ?? "Error" });
  embed.setDescription(`${codeBlock("js", error.toString().substring(0, 4000))}`);
  embed.addFields({
    name: "Description",
    value: `${content?.message || content || err?.message || "NA"}`,
  });
  const fullErr = await postToHaste(util.inspect(err instanceof Error ? err : content, { depth: null })).catch(() => {});
  webhookLogger?.send({ username: "Error Log", embeds: [embed], content: `Error ID: ${errorId}\n${fullErr}` }).catch(() => {});
}

