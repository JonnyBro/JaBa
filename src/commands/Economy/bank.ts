import { editReplyError, getLocalizedDesc, translateContext } from "@/helpers/extenders.js";
import { asyncForEach, getNoun } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, CacheType, ChatInputCommandInteraction, InteractionContextType } from "discord.js";

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

async function formatCredits(interaction: ChatInputCommandInteraction<CacheType>, amount: number) {
	const forms = [await translateContext(interaction, "misc:NOUNS:CREDIT:1"), await translateContext(interaction, "misc:NOUNS:CREDIT:2"), await translateContext(interaction, "misc:NOUNS:CREDIT:5")];
	const noun = getNoun(amount, forms);
	return `**${amount}** ${noun}`;
}

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const memberId = interaction.user.id;
	const guildId = interaction.guildId!;
	const memberData = await client.getMemberData(memberId, guildId);
	const choice = interaction.options.getString("option", true);
	const creditsChoice = interaction.options.getString("credits");

	if (!creditsChoice) {
		return editReplyError(interaction, "misc:OPTION_NAN_ALL");
	}

	const credits = creditsChoice.toLowerCase() === "all" ? memberData.money : Number(creditsChoice);

	if (isNaN(credits) || credits < 1) {
		return editReplyError(interaction, "misc:OPTION_NAN_ALL");
	}

	const embed = createEmbed();

	switch (choice) {
		case "deposit": {
			if (memberData.money < credits) {
				return editReplyError(interaction, "economy/bank:NOT_ENOUGH_CREDIT", {
					money: await formatCredits(interaction, credits),
				});
			}
			memberData.money -= credits;
			memberData.bankSold += credits;
			memberData.transactions.push({
				user: await translateContext(interaction, "economy/transactions:BANK"),
				amount: credits,
				date: Date.now(),
				type: "send",
			});
			await memberData.save();

			embed.setDescription(
				await translateContext(interaction, "economy/bank:SUCCESS_DEP", {
					money: await formatCredits(interaction, credits),
				}),
			);
			break;
		}

		case "withdraw": {
			if (memberData.bankSold < credits) {
				return editReplyError(interaction, "economy/bank:NOT_ENOUGH_CREDIT", {
					money: await formatCredits(interaction, credits),
				});
			}
			memberData.money += credits;
			memberData.bankSold -= credits;
			memberData.transactions.push({
				user: await translateContext(interaction, "economy/transactions:BANK"),
				amount: credits,
				date: Date.now(),
				type: "got",
			});
			await memberData.save();

			embed.setDescription(
				await translateContext(interaction, "economy/bank:SUCCESS_WD", {
					money: await formatCredits(interaction, credits),
				}),
			);
			break;
		}
		case "balance": {
			const targetUser = interaction.options.getUser("user") || interaction.user;
			if (targetUser.bot) {
				return editReplyError(interaction, "economy/money:BOT_USER");
			}

			const targetData = targetUser.id === interaction.user.id ? memberData : await client.getMemberData(targetUser.id, guildId);

			let globalMoney = 0;
			const guilds = client.guilds.cache.filter(g => g.members.cache.has(targetUser.id));
			const guldsArray = Array.from(guilds.values());
			await asyncForEach(guldsArray, async guild => {
				const data = await client.getMemberData(targetUser.id, guild.id);
				globalMoney += data.money + data.bankSold;
			});

			embed.setFields([
				{
					name: await translateContext(interaction, "economy/profile:CASH"),
					value: await formatCredits(interaction, targetData.money),
					inline: true,
				},
				{
					name: await translateContext(interaction, "economy/profile:BANK"),
					value: await formatCredits(interaction, targetData.bankSold),
					inline: true,
				},
				{
					name: await translateContext(interaction, "economy/profile:GLOBAL"),
					value: await formatCredits(interaction, globalMoney),
					inline: true,
				},
			]);
			break;
		}

		default:
			return editReplyError(interaction, "misc:OPTION_NAN_ALL");
	}

	await interaction.editReply({ embeds: [embed] });
};
