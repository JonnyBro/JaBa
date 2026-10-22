import {
	ColorResolvable,
	ContainerBuilder,
	resolveColor,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	ThumbnailBuilder,
} from "discord.js";
import { defaultColor, defaultFooterText } from "./create-embed.js";

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
