const Command = require("../../base/Command");

const games = {};

class Horserace extends Command {
	constructor(client) {
		super(client, {
			name: "horserace",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["hr"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		if (!args[0]) return message.error("fun/horserace:MISSING_STATUS");
		const author = message.author;

		if (args[0] === "create") {
			let thisGame = games[message.channel.id];

			if (thisGame) message.error("fun/horserace:GAME_RUNNING");
			else {
				games[message.channel.id] = {
					horseSpeeds: [],
					bets: []
				};

				thisGame = games[message.channel.id];

				const f = [];
				for (let i = 0; i < 5; i++) {
					const speed = Math.ceil(Math.random() * 10);
					const profit = Math.floor((((8.9 / 9) * (10 - speed)) + 1.1) * 10) / 10;
					thisGame.horseSpeeds.push(speed);
					f.push({
						name: message.translate("fun/horserace:HORSE_NAME", {
							number: i + 1
						}),
						value: message.translate("fun/horserace:HORSE_VALUE", {
							speed,
							profit: Math.round(profit * 100)
						})
					});
				}
				message.channel.send({
					embeds: [{
						color: data.config.embed.color,
						title: message.translate("fun/horserace:EMBED_T"),
						fields: f
					}]
				});
			}
		} else if (args[0] === "bet") {
			const thisGame = games[message.channel.id];
			const horse = parseInt(args[1]);
			const amount = parseInt(args[2]);

			if (horse > 5) return message.error("fun/horserace:HORSE_NUM");
			if (!thisGame) return message.error("fun/horserace:NO_GAME_RUNNING");

			if (!amount || isNaN(amount) || parseInt(amount, 10) <= 0) return message.error("economy/pay:INVALID_AMOUNT");
			if (amount > data.memberData.money) return message.error("economy/pay:ENOUGH_MONEY", {
				amount: `**${amount}** ${message.getNoun(amount, message.translate("misc:NOUNS:CREDITS:1"), message.translate("misc:NOUNS:CREDITS:2"), message.translate("misc:NOUNS:CREDITS:5"))}`
			});

			thisGame.bets[author.id] = {
				amount: amount,
				horse: horse
			};

			message.sendT("fun/horserace:BET", {
				user: author.username,
				amount: `**${Math.floor(amount)}** ${message.getNoun(Math.floor(amount), message.translate("misc:NOUNS:CREDITS:1"), message.translate("misc:NOUNS:CREDITS:2"), message.translate("misc:NOUNS:CREDITS:5"))}`,
				horse: horse
			});

		} else if (args[0] === "go") {
			const thisGame = games[message.channel.id];
			const horsePositions = [0, 0, 0, 0, 0];

			if (!thisGame) return message.error("fun/horserace:NO_GAME_RUNNING");

			// eslint-disable-next-line no-constant-condition
			while (true) {
				for (let i = 0; i < 5; i++) {
					if (thisGame.horseSpeeds[i] >= Math.random() * 15) {
						horsePositions[i] += 1;
						if (horsePositions[i] === 3) {
							const winnings = [];

							const profit = Math.floor((((8.9 / 9) * (10 - thisGame.horseSpeeds[i])) + 1.1) * 10) / 10;

							for (let j = 0; j < Object.keys(thisGame.bets).length; j++) {
								if (Object.values(thisGame.bets)[j].horse === i + 1) {
									winnings.push([Object.keys(thisGame.bets)[j], Object.values(thisGame.bets)[j].amount * profit]);
								}
							}

							if (winnings.length === 0) {
								for (let j = 0; j < Object.keys(thisGame.bets).length; j++) {
									if (Object.values(thisGame.bets)[j].horse !== i + 1) {
										const info = {
											user: message.translate("economy/transactions:HORSERACE"),
											amount: Object.values(thisGame.bets)[j].amount,
											date: Date.now(),
											type: "send"
										};

										data.memberData.transactions.push(info);
										data.memberData.money -= Object.values(thisGame.bets)[j].amount;
									}
								}

								message.sendT("fun/horserace:NO_WINNERS", {
									horse: i + 1
								});
							} else {
								let winners = "";
								for (let j = 0; j < winnings.length; j++) {
									winners += `\n<@${winnings[j][0]}> выиграл **${Math.floor(winnings[j][1])}** ${message.getNoun(Math.floor(winnings[j][1]), message.translate("misc:NOUNS:CREDITS:1"), message.translate("misc:NOUNS:CREDITS:2"), message.translate("misc:NOUNS:CREDITS:5"))}!`;

									const memberData = await this.client.findOrCreateMember({
										id: winnings[j][0],
										guildID: message.guild.id
									});

									const info = {
										user: message.translate("economy/transactions:HORSERACE"),
										amount: Math.floor(winnings[j][1]),
										date: Date.now(),
										type: "got"
									};

									memberData.transactions.push(info);
									memberData.money += Math.floor(winnings[j][1]);
									memberData.save();
								}

								message.sendT("fun/horserace:WINNERS", {
									horse: i + 1,
									winners
								});
							}

							delete games[message.channel.id];
							return;
						}
					}
				}
			}
		}
	}
}

module.exports = Horserace;