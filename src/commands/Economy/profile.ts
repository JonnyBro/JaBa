import { renderBankPanel } from "@/commands/Economy/bank.js";
import { cooldownTime, formatCredits, getGlobalCredits, giveRep } from "@/helpers/economy.js";
import { editReplyError, getLocalizedDesc, getXpForNextLevel, translateContext } from "@/helpers/functions.js";
import { activeEffects, EFFECT_EMOJI, getShopItems, itemLabel } from "@/helpers/shop.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import {
	addTextWithThumbnail,
	containerMessage,
	createContainer,
	createSeparator,
	createText,
} from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	Interaction,
	InteractionContextType,
	MessageFlags,
	User,
} from "discord.js";

const client = useClient();

const PROFILE_ID = "ECO_PROFILE";
const BAR_SIZE = 12;

export const data: CommandData = {
	name: "profile",
	...getLocalizedDesc("economy/profile:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "user",
			...getLocalizedDesc("common:USER"),
			type: ApplicationCommandOptionType.User,
		},
	],
};

const bar = (share: number) => {
	const filled = Math.min(Math.round(share * BAR_SIZE), BAR_SIZE);
	return `${"▰".repeat(filled)}${"▱".repeat(BAR_SIZE - filled)}`;
};

const renderProfile = async (interaction: Interaction, user: User) => {
	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);

	const [memberData, userData, globalCredits, shopItems] = await Promise.all([
		client.getMemberData(interaction.guildId!, user.id),
		client.getUserData(user.id),
		getGlobalCredits(user.id),
		getShopItems(interaction.guildId!),
	]);

	const member = await interaction.guild!.members.fetch(user.id).catch(() => null);
	const name = member?.displayName ?? user.displayName;
	const neededXp = getXpForNextLevel(memberData.level);

	const header = [`## ${name}`, userData.bio && `*${userData.bio}*`, `-# ${user.toString()}`].filter(Boolean);

	const economy = [
		await t("economy/profile:CREDITS", { credits: await formatCredits(interaction, memberData.money) }),
		await t("economy/profile:BANK", { credits: await formatCredits(interaction, memberData.bank) }),
		await t("economy/profile:GLOBAL", { credits: await formatCredits(interaction, globalCredits) }),
	];

	const progress = [
		await t("economy/profile:LEVEL", { level: memberData.level }),
		`${bar(memberData.exp / neededXp)} ${await t("economy/profile:XP", { xp: memberData.exp, totalXp: neededXp })}`,
		await t("economy/profile:REPUTATION", { rep: userData.rep }),
	];

	const shopById = new Map(shopItems.map(item => [item._id.toString(), item]));
	const collectibles = memberData.inventory
		.map(entry => ({ item: shopById.get(entry.item.toString()), quantity: entry.quantity }))
		.filter(entry => entry.item?.type === "item" && entry.quantity > 0)
		.map(({ item, quantity }) => `${itemLabel(item!)}${quantity > 1 ? ` ×${quantity}` : ""}`);
	const effects = await Promise.all(
		activeEffects(memberData).map(
			async ({ effect, until }) =>
				`${EFFECT_EMOJI[effect]} ${await t(`economy/shop:EFFECTS:${effect}`)} ${cooldownTime(until)}`,
		),
	);

	const extras = [
		collectibles.length && (await t("economy/profile:ITEMS", { items: collectibles.join(", ") })),
		effects.length && (await t("economy/profile:EFFECTS", { effects: effects.join(", ") })),
	].filter(Boolean);

	const notDefined = await t("common:NOT_DEFINED");
	const dates = [
		await t("economy/profile:BIRTHDATE", {
			birthdate: userData.birthdate ? `<t:${Math.floor(userData.birthdate / 1000)}:D>` : notDefined,
		}),
		await t("economy/profile:REGISTERED", { date: `<t:${Math.floor(memberData.registeredAt / 1000)}:D>` }),
	];

	const container = addTextWithThumbnail(createContainer(), header.join("\n"), user.displayAvatarURL({ size: 256 }))
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(createText(economy.join("\n")))
		.addSeparatorComponents(createSeparator(false))
		.addTextDisplayComponents(createText(progress.join("\n")))
		.addSeparatorComponents(createSeparator(false));

	if (extras.length)
		container
			.addTextDisplayComponents(createText(extras.join("\n")))
			.addSeparatorComponents(createSeparator(false));

	container.addTextDisplayComponents(createText(`-# ${dates.join(" • ")}`));

	const own = user.id === interaction.user.id;
	const button = new ButtonBuilder()
		.setCustomId(`${PROFILE_ID}:${own ? "bank" : "rep"}:${user.id}`)
		.setLabel(await t(own ? "economy/bank:BANK" : "economy/profile:BTN_REP"))
		.setEmoji(own ? "🏦" : "🎩")
		.setStyle(own ? ButtonStyle.Secondary : ButtonStyle.Success);

	container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(button));

	return containerMessage(container);
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const user = interaction.options.getUser("user") || interaction.user;
	if (user.bot) return editReplyError(interaction, "misc:BOT_USER");

	await interaction.editReply(await renderProfile(interaction, user));
};

componentRouter.register(PROFILE_ID, async interaction => {
	if (!interaction.isButton()) return;

	const [, action, userId] = interaction.customId.split(":");
	const ephemeral = async (content: string) =>
		void (await interaction.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } }));

	if (action === "bank") {
		if (interaction.user.id !== userId)
			return ephemeral(await translateContext(interaction, "economy/bank:NOT_YOURS"));

		await interaction.reply({
			...(await renderBankPanel(interaction, interaction.user)),
			flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
		});
		return;
	}

	if (action !== "rep") return;
	if (interaction.user.id === userId) return ephemeral(await translateContext(interaction, "misc:CANT_YOURSELF"));

	const { given, until } = await giveRep(interaction.user.id, userId);
	if (!given)
		return ephemeral(await translateContext(interaction, "economy/rep:COOLDOWN", { time: cooldownTime(until) }));

	const target = await client.users.fetch(userId);

	// The profile was opened by someone else, so the rep button stays and the numbers refresh
	await interaction.message.edit(await renderProfile(interaction, target)).catch(() => {});
	await ephemeral(await translateContext(interaction, "economy/rep:SUCCESS", { user: target.toString() }));
});
