import { getUsername, translateContext } from "@/helpers/functions.js";
import { componentRouter } from "@/utils/component-router.js";
import { createContainer, createSeparator, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	GuildMember,
	ImageExtension,
	Interaction,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
	User,
} from "discord.js";

const AVATAR_VIEW_ID = "AVATAR_VIEW";

type AvatarMode = "global" | "server";

export const buildAvatarPanel = async (
	interaction: Interaction,
	user: User,
	member?: GuildMember | null,
	mode?: AvatarMode,
) => {
	const hasServerAvatar = !!member?.avatar && member.avatar !== user.avatar;
	const current: AvatarMode = mode || (hasServerAvatar ? "server" : "global");
	const target = current === "server" && member ? member : user;
	const hash = current === "server" && member?.avatar ? member.avatar : user.avatar;

	const formats: ImageExtension[] = !hash
		? ["png"]
		: hash.startsWith("a_")
			? ["gif", "png", "webp"]
			: ["png", "webp"];
	const url = (extension: ImageExtension) =>
		target.displayAvatarURL({ extension, forceStatic: extension !== "gif", size: 4096 });

	const container = createContainer(member?.displayColor || undefined)
		.addTextDisplayComponents(createText(`## ${(member || user).displayName}\n-# ${getUsername(user)}`))
		.addMediaGalleryComponents(
			new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url(formats[0]))),
		)
		.addSeparatorComponents(createSeparator(false));

	if (hasServerAvatar) {
		const modeButton = async (buttonMode: AvatarMode) =>
			new ButtonBuilder()
				.setCustomId(`${AVATAR_VIEW_ID}:${buttonMode}:${user.id}`)
				.setLabel(await translateContext(interaction, `general/avatar:${buttonMode.toUpperCase()}`))
				.setStyle(buttonMode === current ? ButtonStyle.Primary : ButtonStyle.Secondary)
				.setDisabled(buttonMode === current);

		container.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(await modeButton("server"), await modeButton("global")),
		);
	}

	container.addActionRowComponents(
		new ActionRowBuilder<ButtonBuilder>().addComponents(
			formats.map(extension =>
				new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(extension.toUpperCase()).setURL(url(extension)),
			),
		),
	);

	return {
		flags: MessageFlags.IsComponentsV2 as const,
		components: [container],
	};
};

componentRouter.register(AVATAR_VIEW_ID, async interaction => {
	if (!interaction.isButton()) return;

	if (interaction.message.interactionMetadata?.user.id !== interaction.user.id) {
		await interaction.reply({
			content: await translateContext(interaction, "misc:CANT_YOU"),
			flags: MessageFlags.Ephemeral,
		});

		return;
	}

	const [, mode, userId] = interaction.customId.split(":");
	const user = await useClient().users.fetch(userId);
	const member = await interaction.guild?.members.fetch(userId).catch(() => null);

	await interaction.update(await buildAvatarPanel(interaction, user, member, mode as AvatarMode));
});
