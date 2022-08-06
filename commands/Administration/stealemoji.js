const { SlashCommandBuilder, parseEmoji, PermissionFlagsBits } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Stealemoji extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("stealemoji")
				.setDescription(client.translate("administration/stealemoji:DESCRIPTION"))
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
				.addStringOption(option => option.setName("emoji")
					.setDescription(client.translate("common:EMOJI"))
					.setRequired(true)),
			aliases: [],
			dirname: __dirname,
			guildOnly: true
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
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		const parsedEmoji = parseEmoji(interaction.options.getString("emoji"));
		const ext = parsedEmoji.animated ? "gif" : "png";

		interaction.guild.emojis
			.create({
				name: parsedEmoji.name,
				attachment: `https://cdn.discordapp.com/emojis/${parsedEmoji.id}.${ext}`
			})
			.then(emoji => interaction.success("administration/stealemoji:SUCCESS", {
				emoji: emoji.name
			}, { ephemeral: true }))
			.catch(e => {
				console.log(e);
				interaction.error("administration/stealemoji:ERROR", {
					emoji: parsedEmoji.name
				}, { ephemeral: true });
			});
	}
}

module.exports = Stealemoji;