const Command = require("../../base/Command"),
	Discord = require("discord.js");

const currentGames = {};

class Number extends Command {
	constructor(client) {
		super(client, {
			name: "number",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["num"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		if (currentGames[message.guild.id]) return message.error("economy/number:GAME_RUNNING");

		const participants = [],
			number = this.client.functions.randomNum(1000, 6000);

		await message.sendT("economy/number:GAME_START");

		// Store the date wich the game has started
		const gameCreatedAt = Date.now();

		const filter = m => !m.author.bot;
		const collector = new Discord.MessageCollector(message.channel, {
			filter,
			time: 480000 // 8 minutes
		});
		currentGames[message.guild.id] = true;

		collector.on("collect", async msg => {
			if (!participants.includes(msg.author.id)) participants.push(msg.author.id);
			if (msg.content === "STOP") return collector.stop("force");
			if (isNaN(msg.content)) return;

			const parsedNumber = parseInt(msg.content, 10);

			if (parsedNumber === number) {
				const time = this.client.convertTime(message.guild, Date.now() - gameCreatedAt);
				message.sendT("economy/number:GAME_STATS", {
					winner: msg.author.toString(),
					number,
					time,
					participantCount: participants.length,
					participants: participants.map(p => `<@${p}>`).join(", ")
				});

				if (participants.length > 1 && data.guild.disabledCategories && !data.guild.disabledCategories.includes("Economy")) {
					const won = 100 * (participants.length * 0.5);

					message.sendT("economy/number:WON", {
						winner: msg.author.username,
						credits: `**${won}** ${message.getNoun(won, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`
					});

					const memberData = await this.client.findOrCreateMember({
						id: msg.author.id,
						guildID: message.guild.id
					});

					const info = {
						user: message.translate("economy/transactions:NUMBERS"),
						amount: won,
						date: Date.now(),
						type: "got"
					};

					data.memberData.transactions.push(info);

					memberData.money += won;
					memberData.save();
				}

				collector.stop();
			}
			if (parseInt(msg.content) < number) message.error("economy/number:BIG", { user: msg.author.toString(), number: parsedNumber });
			if (parseInt(msg.content) > number) message.error("economy/number:SMALL", { user: msg.author.toString(), number: parsedNumber });
		});

		collector.on("end", (_collected, reason) => {
			delete currentGames[message.guild.id];
			if (reason === "time") return message.error("economy/number:DEFEAT", { number });
			else if (reason === "force") return message.error("misc:FORCE_STOP", { user: message.author.toString() });
		});
	}
}

module.exports = Number;