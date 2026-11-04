import type { MessageBlock } from "@/api/types";

/** Drops empty blocks and empty rows inside them, the way the bot would refuse them anyway */
export const cleanBlocks = (blocks: MessageBlock[]): MessageBlock[] =>
	blocks
		.map(block => {
			if (block.type === "gallery") return { ...block, urls: block.urls.map(u => u.trim()).filter(Boolean) };
			if (block.type === "buttons")
				return { ...block, buttons: block.buttons.filter(b => b.label.trim() || b.url.trim()) };

			return block;
		})
		.filter(block => {
			if (block.type === "text") return block.content.trim();
			if (block.type === "gallery") return block.urls.length;
			if (block.type === "buttons") return block.buttons.length;

			return true;
		});

export const fillBlocks = (blocks: MessageBlock[], vars: Record<string, string>): MessageBlock[] => {
	const fill = (text: string) => text.replace(/\{(\w+)\}/g, (match, name: string) => vars[name] ?? match);

	return blocks.map(block => {
		if (block.type === "text") return { ...block, content: fill(block.content) };
		if (block.type === "buttons")
			return { ...block, buttons: block.buttons.map(b => ({ ...b, label: fill(b.label) })) };

		return block;
	});
};
