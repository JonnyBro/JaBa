const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Divorce extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("divorce")
				.setDescription(client.translate("economy/divorce:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("economy/divorce:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("economy/divorce:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
		});
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction, data) {
		if (!data.userData.lover) return interaction.error("economy/divorce:NOT_MARRIED");
		const user = client.users.cache.get(data.userData.lover) || (await client.users.fetch(data.userData.lover));

		data.userData.lover = null;

		data.userData.markModified();
		await data.userData.save();

		const oldLover = await client.findOrCreateUser(user.id);
		oldLover.lover = null;

		oldLover.markModified();
		await oldLover.save();

		interaction.success("economy/divorce:DIVORCED", {
			user: user.toString(),
		});

		user.send({
			content: interaction.translate("economy/divorce:DIVORCED_U", {
				user: interaction.member.toString(),
			}),
		});
	}
}

module.exports = Divorce;
