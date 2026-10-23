import { createContainer, createSeparator, createText } from "@/utils/create-container.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
	PermissionsBitField,
	SeparatorSpacingSize,
} from "discord.js";
import { FastifyInstance } from "fastify";
import { logAction } from "../../audit.js";
import { getSendableChannel } from "../../channels.js";
import { fail, send } from "../../utils.js";

// Discord limits for a Components V2 message
const MAX_COMPONENTS = 40;
const MAX_TEXT = 4000;
const MAX_GALLERY_ITEMS = 10;
const MAX_BUTTONS = 5;
const MAX_BUTTON_LABEL = 80;

type Block =
	| { type: "text"; content: string }
	| { type: "separator"; divider: boolean; large: boolean }
	| { type: "gallery"; urls: string[] }
	| { type: "buttons"; buttons: { label: string; url: string }[] };

const isUrl = (value: unknown): value is string => {
	if (typeof value !== "string") return false;

	try {
		return ["http:", "https:"].includes(new URL(value).protocol);
	} catch {
		return false;
	}
};

/** Validates the blocks from the request, returns an error message for the first broken one */
const parseBlocks = (input: unknown): Block[] | string => {
	if (!Array.isArray(input) || !input.length) return "Add at least one block";

	const blocks: Block[] = [];
	let textLength = 0;
	let components = 1;

	for (const raw of input as Record<string, unknown>[])
		if (raw?.type === "text") {
			const content = typeof raw.content === "string" ? raw.content.trim() : "";
			if (!content) return "Text blocks can't be empty";

			textLength += content.length;
			components += 1;
			blocks.push({ type: "text", content });
		} else if (raw?.type === "separator") {
			components += 1;
			blocks.push({ type: "separator", divider: raw.divider !== false, large: raw.large === true });
		} else if (raw?.type === "gallery") {
			const urls = Array.isArray(raw.urls) ? raw.urls : [];
			if (!urls.length || urls.length > MAX_GALLERY_ITEMS || !urls.every(isUrl))
				return `A gallery needs 1-${MAX_GALLERY_ITEMS} image links`;

			components += 1 + urls.length;
			blocks.push({ type: "gallery", urls });
		} else if (raw?.type === "buttons") {
			const buttons = Array.isArray(raw.buttons) ? (raw.buttons as Record<string, unknown>[]) : [];
			const valid = buttons.every(
				b =>
					typeof b?.label === "string" &&
					b.label.trim() &&
					b.label.length <= MAX_BUTTON_LABEL &&
					isUrl(b.url),
			);
			if (!buttons.length || buttons.length > MAX_BUTTONS || !valid)
				return `A button row needs 1-${MAX_BUTTONS} buttons with a label and a link`;

			components += 1 + buttons.length;
			blocks.push({
				type: "buttons",
				buttons: buttons.map(b => ({ label: String(b.label).trim(), url: String(b.url) })),
			});
		} else return "Unknown block type";

	if (textLength > MAX_TEXT) return `The text is longer than ${MAX_TEXT} characters`;
	if (components > MAX_COMPONENTS) return `The message has more than ${MAX_COMPONENTS} components`;

	return blocks;
};

const parseColor = (value: unknown) => {
	if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value)) return null;

	return parseInt(value.slice(1), 16);
};

const buildContainer = (blocks: Block[], color: number | null) => {
	const container = createContainer();

	if (color === null) container.clearAccentColor();
	else container.setAccentColor(color);

	for (const block of blocks) {
		if (block.type === "text") container.addTextDisplayComponents(createText(block.content));

		if (block.type === "separator")
			container.addSeparatorComponents(
				createSeparator(block.divider, block.large ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small),
			);

		if (block.type === "gallery")
			container.addMediaGalleryComponents(
				new MediaGalleryBuilder().addItems(block.urls.map(url => new MediaGalleryItemBuilder().setURL(url))),
			);

		if (block.type === "buttons")
			container.addActionRowComponents(
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					block.buttons.map(b =>
						new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(b.label).setURL(b.url),
					),
				),
			);
	}

	return container;
};

export default async function messagesRoutes(fastify: FastifyInstance) {
	fastify.post("/messages", async (req, reply) => {
		const body = (req.body ?? {}) as { channelId?: unknown; blocks?: unknown; color?: unknown; mentions?: unknown };

		const blocks = parseBlocks(body.blocks);
		if (typeof blocks === "string") return fail(reply, 400, blocks);

		const channel = getSendableChannel(req.guild, body.channelId);
		if (!channel) return fail(reply, 400, "The bot can't send messages in this channel");

		// @everyone only works for those who could ping it themselves
		const actor = await req.guild.members.fetch(req.session.user!.id).catch(() => null);
		const canPingEveryone = !!actor?.permissionsIn(channel.id).has(PermissionsBitField.Flags.MentionEveryone);

		const message = await channel.send({
			flags: MessageFlags.IsComponentsV2,
			components: [buildContainer(blocks, parseColor(body.color))],
			allowedMentions: {
				parse:
					body.mentions === true ? ["users", "roles", ...(canPingEveryone ? ["everyone" as const] : [])] : [],
			},
		});

		await logAction(req, req.guild.id, {
			action: "message.send",
			details: { channelId: channel.id, messageUrl: message.url, blocks: blocks.length },
		});

		return send(reply, { url: message.url });
	});
}
