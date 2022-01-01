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

		game.once("win", data => {
			console.log(data.winner + " wins the TicTacToe game!");
			console.log(data.loser + " loses the TicTacToe game!");
		});
	}
};

module.exports = TicTacToe;