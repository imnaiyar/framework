import { codeBlock, EmbedBuilder, WebhookClient } from "discord.js";
import { postToHaste } from "./postToHaste.js";
import util from "node:util";
/**
 * Send error log to the provided discord webhook
 */
export async function sendErrorLog(webhookUrl: string, content: any, err: any, errorId?: string) {
  const webhookLogger = new WebhookClient({ url: webhookUrl });
  if (!content && !err) return;
  const embed = new EmbedBuilder().setColor("Blue").setAuthor({ name: err?.name ?? "Error" });
  const errString: string = err?.stack || err || content?.stack || content;
  embed.setDescription(`${codeBlock("js", errString.toString().substring(0, 4000))}`);
  embed.addFields({
    name: "Description",
    value: `${content?.message || content || err?.message || "NA"}`,
  });
  const fullErr = await postToHaste(util.inspect(err ?? content, { depth: null })).catch(() => {});
  webhookLogger
    ?.send({ username: "Error Log", embeds: [embed], content: `Error ID: ${errorId || "none"}\n${fullErr}` })
    .catch(() => {});
}
