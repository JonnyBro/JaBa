const Command = require("../../base/Command"),
	tictactoe = require("../../helpers/tictactoe");

class TicTacToe extends Command {
	constructor(client) {
		super(client, {
			name: "tictactoe",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["ttt"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		tictactoe(message, {
			embedColor: data.config.embed.color,
			embedFoot: data.config.embed.footer
		}).then(async (winner) => {
			message.sendT("economy/number:WON", {
				winner: winner.username
			});

			const memberData = await this.client.findOrCreateMember({
				id: winner.id,
				guildID: message.guild.id
			});

			const info = {
				user: message.translate("economy/tictactoe:DESCRIPTION"),
				amount: 100,
				date: Date.now(),
				type: "got"
			};

			memberData.transactions.push(info);

			memberData.money = memberData.money + 100;
			memberData.save();
		});
	}
}

module.exports = TicTacToe;

// const game = new TTT({ language: "ru" });
// game.handleMessage(message);

// game.on("win", async (data) => {
// 	if (data.winner.id === "AI") return;

// 	message.sendT("fun/number:WON", {
// 		winner: data.winner.displayName
// 	});

// 	const userdata = await this.client.findOrCreateMember({
// 		id: data.winner.id,
// 		guildID: message.guild.id
// 	});

// 	const info = {
// 		user: message.translate("economy/tictactoe:DESCRIPTION"),
// 		amount: 100,
// 		date: Date.now(),
// 		type: "got"
// 	};

// 	data.memberData.transactions.push(info);

// 	userdata.money = userdata.money + 100;
// 	userdata.save();
// });