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
			name: "balance",
			...getLocalizedDesc("economy/bank:BALANCE"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "user",
					...getLocalizedDesc("common:USER"),
					type: ApplicationCommandOptionType.User,
				},
			],
		},
		{
			name: "deposit",
			...getLocalizedDesc("economy/bank:DEPOSIT"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "credits",
					...getLocalizedDesc("economy/bank:OPTION_NAN_ALL"),
					type: ApplicationCommandOptionType.String,
					required: true,
				},
			],
		},
		{
			name: "withdraw",
			...getLocalizedDesc("economy/bank:WITHDRAW"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "credits",
					...getLocalizedDesc("economy/bank:OPTION_NAN_ALL"),
					type: ApplicationCommandOptionType.String,
					required: true,
				},
			],
		},
		{
			name: "transfer",
			...getLocalizedDesc("economy/bank:TRANSFER"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "user",
					...getLocalizedDesc("common:USER"),
					type: ApplicationCommandOptionType.User,
					required: true,
				},
				{
					name: "credits",
					...getLocalizedDesc("economy/bank:OPTION_NAN_ALL"),
					type: ApplicationCommandOptionType.String,
					required: true,
				},
			],
		},
		{
			name: "transactions",
			...getLocalizedDesc("economy/bank:TRANSACTIONS"),
			type: ApplicationCommandOptionType.Subcommand,
		},
	],
};

// TODO: Move from embeds to components v2
export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const subcommand = interaction.options.getSubcommand();

	const guildId = interaction.guildId!;
	const memberId = interaction.user.id;
	const memberData = await client.getMemberData(memberId, guildId);
	const embed = createEmbed();

	switch (subcommand) {
		case "balance": {
			const targetUser = interaction.options.getUser("user") || interaction.user;
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
				globalMoney += data.money + data.bank;
			});

			embed.setFields([
				{
					name: (await translateContext(interaction, "economy/profile:CREDITS")).split(
						":",
					)[0],
					value: await formatCredits(interaction, targetData.money),
					inline: true,
				},
				{
					name: (await translateContext(interaction, "economy/profile:BANK")).split(
						":",
					)[0],
					value: await formatCredits(interaction, targetData.bank),
					inline: true,
				},
				{
					name: (await translateContext(interaction, "economy/profile:GLOBAL")).split(
						":",
					)[0],
					value: await formatCredits(interaction, globalMoney),
					inline: true,
				},
			]);

			break;
		}

		case "deposit": {
			const creditsOption = interaction.options.getString("credits")?.toLowerCase();
			const credits = creditsOption === "all" ? memberData.money : Number(creditsOption);

			if (credits <= 0) return editReplyError(interaction, "misc:MORE_THAN_ZERO");
			if (memberData.money < credits) {
				return editReplyError(interaction, "economy/bank:NOT_ENOUGH_CREDITS");
			}

			memberData.set({
				money: memberData.money - credits,
				bank: memberData.bank + credits,
			});
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
			const creditsOption = interaction.options.getString("credits")?.toLowerCase();
			const credits = creditsOption === "all" ? memberData.money : Number(creditsOption);

			if (credits <= 0) return editReplyError(interaction, "misc:MORE_THAN_ZERO");
			if (memberData.bank < credits) {
				return editReplyError(interaction, "economy/bank:NOT_ENOUGH_BANK");
			}

			memberData.set({
				money: memberData.money + credits,
				bank: memberData.bank - credits,
			});
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
			const creditsOption = interaction.options.getString("credits")?.toLowerCase();
			const credits = creditsOption === "all" ? memberData.bank : Number(creditsOption);

			const targetUser = interaction.options.getUser("user") || interaction.user;
			if (targetUser.bot) return editReplyError(interaction, "misc:BOT_USER");

			if (credits <= 0) return editReplyError(interaction, "misc:MORE_THAN_ZERO");
			if (memberData.bank < credits) {
				return editReplyError(interaction, "economy/bank:NOT_ENOUGH_BANK");
			}
			if (interaction.user.id === targetUser.id) {
				return editReplyError(interaction, "misc:CANT_YOURSELF");
			}

			const recieverData = await client.getMemberData(targetUser.id, guildId);

			memberData.set("bank", memberData.bank - credits);
			recieverData.set("bank", recieverData.bank + credits);

			memberData.transactions.push({
				user: await translateContext(interaction, "economy/bank:TRANSFER_TO", {
					user: getUsername(targetUser),
				}),
				amount: credits,
				date: Date.now(),
				type: "send",
			});

			recieverData.transactions.push({
				user: await translateContext(interaction, "economy/bank:TRANSFER_FROM", {
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
					reciever: targetUser.toString(),
					credits: await formatCredits(interaction, credits),
				}),
			);

			break;
		}

		case "transactions": {
			const transactions = memberData.transactions;
			const sortedTransactions: string[][] = [[], []];

			const sortedTransactionArray = transactions
				.sort((a, b) => b.date - a.date)
				.slice(0, 20);

			await Promise.all(
				sortedTransactionArray.map(async t => {
					const array = t.type === "got" ? sortedTransactions[0] : sortedTransactions[1];

					const [translated, amountText, dateText] = await Promise.all([
						translateContext(
							interaction,
							"economy/bank:T_USER_" + t.type.toUpperCase(),
						),
						translateContext(interaction, "economy/bank:T_AMOUNT"),
						translateContext(interaction, "economy/bank:T_DATE"),
					]);

					array.push(
						`${translated}: ${t.user}\n${amountText}: ${t.amount}\n${dateText}:
						<t:${Math.floor(t.date / 1000)}:f>\n`,
					);
				}),
			);

			if (transactions.length <= 0) {
				embed.setDescription(
					await translateContext(interaction, "economy/bank:NO_TRANSACTIONS"),
				);
			} else {
				if (sortedTransactions[0].length > 0) {
					embed.addFields([
						{
							name: await translateContext(interaction, "economy/bank:T_GOT"),
							value: sortedTransactions[0].join("\n"),
							inline: true,
						},
					]);
				}

				if (sortedTransactions[1].length > 0) {
					embed.addFields([
						{
							name: await translateContext(interaction, "economy/bank:T_SEND"),
							value: sortedTransactions[1].join("\n"),
							inline: true,
						},
					]);
				}
			}

			break;
		}
	}

	await interaction.editReply({ embeds: [embed] });
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
