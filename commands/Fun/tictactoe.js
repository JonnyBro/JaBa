const Command = require("../../base/Command.js"),
	TTT = require("discord-tictactoe");

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

	async run(message, args) {
		const game = new TTT({ language: "ru" })
		game.handleMessage(message);

		game.on("win", async (data) => {
			message.sendT("fun/number:WON", {
				winner: data.winner.displayName
			});

			const userdata = await this.client.findOrCreateMember({
				id: data.winner.id,
				guildID: message.guild.id
			});

			userdata.money = userdata.money + 100;
			userdata.save();
		});
	}
};

module.exports = TicTacToe;