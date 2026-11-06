import { getLocale, translateContext } from "@/helpers/functions.js";
import { AttachmentBuilder, Collection, Message, ThreadChannel } from "discord.js";

const MAX_MESSAGES = 5000;
const TEXT_DISPLAY = 10;

export interface TranscriptInfo {
	subject: string | null;
	authorId: string | null;
	openedAt: Date;
	closedBy: string;
	reason?: string | null;
}

const escape = (text: string) =>
	text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fetchAll = async (thread: ThreadChannel) => {
	const messages: Message[] = [];
	let before: string | undefined;

	while (messages.length < MAX_MESSAGES) {
		const batch: Collection<string, Message> = await thread.messages.fetch({ limit: 100, before });
		if (!batch.size) break;

		messages.push(...batch.values());
		before = batch.lastKey();
	}

	return messages.reverse();
};

/** Components V2 messages keep their text deep inside containers and sections */
const collectText = (node: unknown, out: string[] = []) => {
	if (Array.isArray(node)) node.forEach(child => collectText(child, out));
	else if (node && typeof node === "object") {
		const record = node as Record<string, unknown>;
		if (record.type === TEXT_DISPLAY && typeof record.content === "string") out.push(record.content);

		for (const value of Object.values(record)) if (typeof value === "object") collectText(value, out);
	}

	return out;
};

const renderContent = (thread: ThreadChannel, text: string, locale: string) =>
	escape(text)
		.replace(/&lt;@!?(\d+)&gt;/g, (_, id: string) => {
			const user = thread.client.users.cache.get(id);

			return `<span class="mention">@${escape(user?.username ?? id)}</span>`;
		})
		.replace(/&lt;@&amp;(\d+)&gt;/g, (_, id: string) => {
			const role = thread.guild.roles.cache.get(id);

			return `<span class="mention">@${escape(role?.name ?? id)}</span>`;
		})
		.replace(/&lt;#(\d+)&gt;/g, (_, id: string) => {
			const channel = thread.guild.channels.cache.get(id);

			return `<span class="mention">#${escape(channel?.name ?? id)}</span>`;
		})
		.replace(/&lt;t:(\d+)(?::\w)?&gt;/g, (_, seconds: string) =>
			new Date(Number(seconds) * 1000).toLocaleString(locale),
		);

const renderMessage = (thread: ThreadChannel, message: Message, locale: string) => {
	const member = thread.guild.members.cache.get(message.author.id);
	const name = member?.displayName ?? message.author.globalName ?? message.author.username;

	const parts = [
		message.content,
		...collectText(message.components.map(component => component.toJSON())),
		...message.embeds.map(embed => [embed.title, embed.description].filter(Boolean).join("\n")),
	].filter(Boolean);

	const attachments = message.attachments.map(attachment => {
		const url = escape(attachment.url);
		if (attachment.contentType?.startsWith("image/"))
			return `<a href="${url}"><img src="${url}" alt="${escape(attachment.name)}"></a>`;

		return `<a href="${url}">📎 ${escape(attachment.name)}</a>`;
	});

	const badge = message.author.bot ? "<span class=bot>BOT</span>" : "";
	const time = escape(message.createdAt.toLocaleString(locale));

	return `<div class="message">
<img class="avatar" src="${escape(message.author.displayAvatarURL({ size: 64 }))}" alt="">
<div>
<div class="head"><b>${escape(name)}</b> ${badge} <span class="time">${time}</span></div>
${parts.map(part => `<div class="text">${renderContent(thread, part, locale)}</div>`).join("\n")}
${attachments.length ? `<div class="files">${attachments.join("")}</div>` : ""}
</div>
</div>`;
};

export const buildTranscript = async (thread: ThreadChannel, info: TranscriptInfo) => {
	const locale = await getLocale(thread.guild.id);
	const t = (key: string, args?: Record<string, unknown>) =>
		translateContext(thread.guild, `tickets/ticket:${key}`, args);

	const messages = (await fetchAll(thread)).filter(message => !message.system);
	const user = (id: string | null) => (id ? escape(thread.client.users.cache.get(id)?.username ?? id) : "?");

	const meta = [
		[await t("TRANSCRIPT_AUTHOR"), user(info.authorId)],
		[await t("TRANSCRIPT_OPENED"), escape(info.openedAt.toLocaleString(locale))],
		[await t("TRANSCRIPT_CLOSED"), `${user(info.closedBy)}, ${escape(new Date().toLocaleString(locale))}`],
		info.reason && [await t("TRANSCRIPT_REASON"), escape(info.reason)],
		[await t("TRANSCRIPT_MESSAGES"), String(messages.length)],
	].filter((row): row is string[] => !!row);

	const html = `<!DOCTYPE html>
<html lang="${escape(locale.split("-")[0])}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(info.subject ?? thread.name)}</title>
<style>
body { margin: 0; padding: 24px; background: #313338; color: #dbdee1; font: 15px/1.4 system-ui, sans-serif; }
main { max-width: 900px; margin: 0 auto; }
h1 { margin: 0 0 4px; font-size: 22px; color: #f2f3f5; }
.server { color: #949ba4; margin-bottom: 16px; }
table { border-collapse: collapse; margin-bottom: 24px; }
td { padding: 2px 16px 2px 0; vertical-align: top; }
td:first-child { color: #949ba4; }
.message { display: flex; gap: 12px; padding: 8px 0; border-top: 1px solid #3f4147; }
.avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
.head b { color: #f2f3f5; }
.time { color: #949ba4; font-size: 12px; margin-left: 4px; }
.bot { background: #5865f2; color: #fff; font-size: 10px; padding: 1px 4px; border-radius: 3px; }
.text { white-space: pre-wrap; word-break: break-word; margin-top: 2px; }
.mention { background: #5865f24d; color: #c9cdfb; border-radius: 3px; padding: 0 2px; }
.files { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.files img { max-width: 360px; max-height: 280px; border-radius: 4px; }
a { color: #00a8fc; }
</style>
</head>
<body>
<main>
<h1>${escape(info.subject ?? thread.name)}</h1>
<div class="server">${escape(thread.guild.name)} · #${escape(thread.parent?.name ?? "")}</div>
<table>${meta.map(([key, value]) => `<tr><td>${escape(key)}</td><td>${value}</td></tr>`).join("")}</table>
${messages.map(message => renderMessage(thread, message, locale)).join("\n")}
</main>
</body>
</html>
`;

	return new AttachmentBuilder(Buffer.from(html, "utf8"), { name: `ticket-${thread.id}.html` });
};
