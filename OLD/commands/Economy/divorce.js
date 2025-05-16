const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Divorce extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
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
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
				.setContexts([InteractionContextType.Guild]),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		const userData = interaction.data.user;

		if (!userData.lover) return interaction.error("economy/divorce:NOT_MARRIED");
		const user = client.users.cache.get(userData.lover) || await client.users.fetch(userData.lover);

		userData.lover = null;

		await userData.save();

		const oldLover = await client.getUserData(user.id);
		oldLover.lover = null;

		await oldLover.save();

		interaction.success("economy/divorce:DIVORCED", {
			user: user.toString(),
		});

		try {
			user.send({
				content: interaction.translate("economy/divorce:DIVORCED_U", {
					user: interaction.member.toString(),
				}),
			});
		} catch (e) { /**/ }
	}
}

module.exports = Divorce;
