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
			resultBtn: true,
			embedColor: data.config.embed.color,
			embedFoot: data.config.embed.footer
		}).then(async winner => {
			const memberData = await this.client.findOrCreateMember({
				id: winner.id,
				guildID: message.guild.id
			});

			const info = {
				user: message.translate("economy/transactions:TTT"),
				amount: 100,
				date: Date.now(),
				type: "got"
			};

			memberData.transactions.push(info);

			memberData.money += 100;
			memberData.save();
		});
	}
}

module.exports = TicTacToe;