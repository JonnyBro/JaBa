import {
	asyncForEach,
	editReplyError,
	getLocalizedDesc,
	getNoun,
	getUsername,
	translateContext,
} from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	CacheType,
	ChatInputCommandInteraction,
	InteractionContextType,
} from "discord.js";

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
				{ name: client.i18n.translate("economy/bank:BALANCE"), value: "balance" },
				{ name: client.i18n.translate("economy/bank:DEPOSIT"), value: "deposit" },
				{ name: client.i18n.translate("economy/bank:WITHDRAW"), value: "withdraw" },
				{ name: client.i18n.translate("economy/bank:TRANSFER"), value: "transfer" },
			],
		},
		{
			name: "user",
			...getLocalizedDesc("common:USER"),
			type: ApplicationCommandOptionType.User,
		},
		{
			name: "credits",
			...getLocalizedDesc("economy/bank:OPTION_NAN_ALL"),
			type: ApplicationCommandOptionType.String,
		},
	],
};

async function formatCredits(interaction: ChatInputCommandInteraction<CacheType>, amount: number) {
	const forms = [
		await translateContext(interaction, "misc:NOUNS:CREDIT:1"),
		await translateContext(interaction, "misc:NOUNS:CREDIT:2"),
		await translateContext(interaction, "misc:NOUNS:CREDIT:5"),
	];
	const noun = getNoun(amount, forms);
	return `**${amount}** ${noun}`;
}

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const memberId = interaction.user.id;
	const guildId = interaction.guildId!;
	const memberData = await client.getMemberData(memberId, guildId);
	const choice = interaction.options.getString("option", true);
	const targetUser = interaction.options.getUser("user") || interaction.user;
	const creditsChoice = interaction.options.getString("credits");

	if (!creditsChoice && choice !== "balance") {
		return editReplyError(interaction, "misc:MORE_THAN_ZERO");
	}

	const embed = createEmbed();

	switch (choice) {
		case "balance": {
			if (targetUser.bot) return editReplyError(interaction, "misc:BOT_USER");

			const targetData =
				targetUser.id === interaction.user.id
					? memberData
					: await client.getMemberData(targetUser.id, guildId);

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

		case "deposit": {
			const credits =
				creditsChoice!.toLowerCase() === "all" ? memberData.money : Number(creditsChoice);
			if (isNaN(credits) || credits < 1) {
				return editReplyError(interaction, "misc:MORE_THAN_ZERO");
			}
			if (memberData.money < credits) {
				return editReplyError(interaction, "economy/bank:NOT_ENOUGH_CREDIT");
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
					credits: await formatCredits(interaction, credits),
				}),
			);

			break;
		}

		case "withdraw": {
			const credits =
				creditsChoice!.toLowerCase() === "all"
					? memberData.bankSold
					: Number(creditsChoice);
			if (isNaN(credits) || credits < 1) {
				return editReplyError(interaction, "misc:MORE_THAN_ZERO");
			}
			if (memberData.bankSold < credits) {
				return editReplyError(interaction, "economy/bank:NOT_ENOUGH_BANK");
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
					credits: await formatCredits(interaction, credits),
				}),
			);

			break;
		}

		case "transfer": {
			const credits =
				creditsChoice!.toLowerCase() === "all"
					? memberData.bankSold
					: Number(creditsChoice);
			if (isNaN(credits) || credits < 1) {
				return editReplyError(interaction, "misc:MORE_THAN_ZERO");
			}
			if (memberData.bankSold < credits) {
				return editReplyError(interaction, "economy/bank:NOT_ENOUGH_BANK");
			}
			if (interaction.user.id === targetUser.id) {
				return editReplyError(interaction, "misc:CANT_YOURSELF");
			}

			const recieverData = await client.getMemberData(targetUser.id, guildId);

			memberData.bankSold -= credits;
			recieverData.bankSold += credits;

			memberData.transactions.push({
				user: await translateContext(interaction, "economy/transactions:TRANSFER_TO", {
					user: getUsername(targetUser),
				}),
				amount: credits,
				date: Date.now(),
				type: "send",
			});

			recieverData.transactions.push({
				user: await translateContext(interaction, "economy/transactions:TRANSFER_FROM", {
					user: getUsername(interaction.user),
				}),
				amount: credits,
				date: Date.now(),
				type: "got",
			});

			await memberData.save();
			await recieverData.save();

			embed.setDescription(
				await translateContext(interaction, "economy/bank:SUCCESS_TRANSFER", {
					credits: await formatCredits(interaction, credits),
					reciever: targetUser.toString(),
				}),
			);

			break;
		}

		default:
			return editReplyError(interaction, "misc:MORE_THAN_ZERO");
	}

	await interaction.editReply({ embeds: [embed] });
};
