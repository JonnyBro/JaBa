import packageJson from "@/../package.json" with { type: "json" };
import { IS_PROD } from "@/constants/index.js";
import {
	ColorResolvable,
	ContainerBuilder,
	MessageFlags,
	resolveColor,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	ThumbnailBuilder,
} from "discord.js";
import useClient from "./use-client.js";

const client = useClient();

const footerBase = client.configService.get<string>("EMBED_FOOTER");

export const defaultFooterText = IS_PROD ? `${footerBase} | ${packageJson.version}` : footerBase;

const defaultColor = client.configService.get<ColorResolvable>("EMBED_COLOR");

export const createContainer = (color?: ColorResolvable) =>
	new ContainerBuilder().setAccentColor(resolveColor(color || defaultColor));

export const createText = (content: string) => new TextDisplayBuilder().setContent(content);

export const createSeparator = (divider = true, spacing = SeparatorSpacingSize.Small) =>
	new SeparatorBuilder().setDivider(divider).setSpacing(spacing);

export const createFooter = (text = defaultFooterText) => createText(`-# ${text}`);

export const addTextWithThumbnail = (container: ContainerBuilder, content: string, thumbnailUrl?: string | null) => {
	if (!thumbnailUrl) return container.addTextDisplayComponents(createText(content));

	const section = new SectionBuilder()
		.addTextDisplayComponents(createText(content))
		.setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailUrl));

	return container.addSectionComponents(section);
};

export const containerMessage = (container: ContainerBuilder) => ({
	flags: MessageFlags.IsComponentsV2 as const,
	components: [container],
	allowedMentions: { parse: [] },
});
