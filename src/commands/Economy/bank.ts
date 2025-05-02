import { editReplyError, getLocalizedDesc, translateContext } from "@/helpers/extenders.js";
import { asyncForEach, getNoun } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "bank",
	...getLocalizedDesc("economy/bank:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "option",
			...getLocalizedDesc("economy/bank:OPTION"),
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: client.i18n.translate("economy/bank:DEPOSIT"), value: "deposit" },
				{ name: client.i18n.translate("economy/bank:WITHDRAW"), value: "withdraw" },
				{ name: client.i18n.translate("economy/bank:BALANCE"), value: "balance" },
			],
		},
		{
			name: "credits",
			...getLocalizedDesc("misc:OPTION_NAN_ALL"),
			type: ApplicationCommandOptionType.String,
		},
		{
			name: "user",
			...getLocalizedDesc("common:USER"),
			type: ApplicationCommandOptionType.User,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const memberData = await client.getMemberData(interaction.user.id, interaction.guildId!);
	const choice = interaction.options.getString("option", true);

	const creditsChoise = interaction.options.getString("credits");
	if (!creditsChoise) return editReplyError(interaction, "misc:OPTION_NAN_ALL");

	const credits = creditsChoise.toLowerCase() === "all" ? memberData.money : Number(creditsChoise);

	if (isNaN(credits) || credits < 1) return editReplyError(interaction, "misc:OPTION_NAN_ALL");
	if (memberData.money < credits) {
		return editReplyError(interaction, "economy/bank:NOT_ENOUGH_CREDIT", {
			money: `**${credits}** ${getNoun(credits, [await translateContext(interaction, "misc:NOUNS:CREDIT:1"), await translateContext(interaction, "misc:NOUNS:CREDIT:2"), await translateContext(interaction, "misc:NOUNS:CREDIT:5")])}`,
		});
	}

	const info = {
		user: await translateContext(interaction, "economy/transactions:BANK"),
		amount: credits,
		date: Date.now(),
		type: "send",
	};

	const embed = createEmbed();

	if (choice === "deposit") {
		memberData.money -= credits;
		memberData.bankSold += credits;

		memberData.transactions.push(info);

		memberData.markModified("money");
		memberData.markModified("bankSold");
		memberData.markModified("transactions");
		await memberData.save();

		embed.setDescription(
			await translateContext(interaction, "economy/bank:SUCCESS_DEP", {
				money: `**${credits}** ${getNoun(credits, [await translateContext(interaction, "misc:NOUNS:CREDIT:1"), await translateContext(interaction, "misc:NOUNS:CREDIT:2"), await translateContext(interaction, "misc:NOUNS:CREDIT:5")])}`,
			}),
		);

		interaction.editReply({
			embeds: [embed],
		});
	} else if (choice === "withdraw") {
		memberData.money += credits;
		memberData.bankSold -= credits;

		info.type = "got";

		memberData.transactions.push(info);

		memberData.markModified("money");
		memberData.markModified("bankSold");
		memberData.markModified("transactions");
		await memberData.save();

		embed.setDescription(
			await translateContext(interaction, "economy/bank:SUCCESS_WD", {
				money: `**${credits}** ${getNoun(credits, [await translateContext(interaction, "misc:NOUNS:CREDIT:1"), await translateContext(interaction, "misc:NOUNS:CREDIT:2"), await translateContext(interaction, "misc:NOUNS:CREDIT:5")])}`,
			}),
		);
	} else {
		const user = interaction.options.getUser("user") || interaction.user;
		if (user.bot) return editReplyError(interaction, "economy/money:BOT_USER");

		const memberDataBank = user.id === interaction.user.id ? memberData : await client.getMemberData(user.id, interaction.guildId!);
		const guilds = client.guilds.cache.filter(g => g.members.cache.find(m => m.id === user.id));

		let globalMoney = 0;
		await asyncForEach(guilds, async guild => {
			const data = await client.getMemberData(user.id, guild.id);
			globalMoney += data.money + data.bankSold;
		});


		embed
			// .setAuthor({
			// 	name: await translateContext(interaction, "economy/money:TITLE", {
			// 		user: getUsername(user),
			// 	}),
			// 	iconURL: user.displayAvatarURL(),
			// })
			.setFields([
				{
					name: await translateContext(interaction, "economy/profile:CASH"),
					value: `**${memberDataBank.money}** ${getNoun(memberDataBank.money, [await translateContext(interaction, "misc:NOUNS:CREDIT:1"), await translateContext(interaction, "misc:NOUNS:CREDIT:2"), await translateContext(interaction, "misc:NOUNS:CREDIT:5")])}`,
					inline: true,
				},
				{
					name: await translateContext(interaction, "economy/profile:BANK"),
					value: `**${memberDataBank.bankSold}** ${getNoun(memberDataBank.bankSold, [await translateContext(interaction, "misc:NOUNS:CREDIT:1"), await translateContext(interaction, "misc:NOUNS:CREDIT:2"), await translateContext(interaction, "misc:NOUNS:CREDIT:5")])}`,
					inline: true,
				},
				{
					name: await translateContext(interaction, "economy/profile:GLOBAL"),
					value: `**${globalMoney}** ${getNoun(globalMoney, [await translateContext(interaction, "misc:NOUNS:CREDIT:1"), await translateContext(interaction, "misc:NOUNS:CREDIT:2"), await translateContext(interaction, "misc:NOUNS:CREDIT:5")])}`,
					inline: true,
				},
			]);

		interaction.editReply({
			embeds: [embed],
		});
	}
};
