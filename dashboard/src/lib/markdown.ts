const escapeHtml = (text: string) =>
	text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const inline = (text: string) =>
	text
		.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 font-mono text-[0.9em]">$1</code>')
		.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
		.replace(/__(.+?)__/g, "<u>$1</u>")
		.replace(/\*(.+?)\*/g, "<em>$1</em>")
		.replace(/~~(.+?)~~/g, "<s>$1</s>")
		.replace(/\|\|(.+?)\|\|/g, '<span class="bg-muted text-transparent hover:text-inherit">$1</span>')
		.replace(
			/\[([^\]]+)\]\(&lt;?(https?:\/\/[^\s)]+?)(?:&gt;)?\)/g,
			'<span class="text-sky-400 underline">$1</span>',
		);

const LINE_RULES: [RegExp, string][] = [
	[/^### (.*)$/, '<p class="text-base font-bold">$1</p>'],
	[/^## (.*)$/, '<p class="text-lg font-bold">$1</p>'],
	[/^# (.*)$/, '<p class="text-xl font-bold">$1</p>'],
	[/^-# (.*)$/, '<p class="text-xs text-muted-foreground">$1</p>'],
	[/^&gt; (.*)$/, '<p class="border-l-4 border-muted-foreground/40 pl-2">$1</p>'],
];

/**
 * A rough preview of Discord markdown. The text is escaped first, so only the tags added here end up in the HTML
 */
export const renderDiscordMarkdown = (text: string) =>
	escapeHtml(text)
		.split("\n")
		.map(line => {
			const content = inline(line);

			for (const [rule, html] of LINE_RULES) if (rule.test(content)) return content.replace(rule, html);

			return content ? `<p>${content}</p>` : "<p>&nbsp;</p>";
		})
		.join("");
