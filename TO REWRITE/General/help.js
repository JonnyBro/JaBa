const Command = require("../../base/Command"),
	{ PermissionsBitField, EmbedBuilder } = require("discord.js");

class Help extends Command {
	constructor(client) {
		super(client, {
			name: "help",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["h", "commands"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		if (args[0]) {
			const isCustom = (message.guild && data.guild.customCommands ? data.guild.customCommands.find((c) => c.name === args[0]) : false);

			const cmd = this.client.commands.get(args[0]) || this.client.commands.get(this.client.aliases.get(args[0]));
			if (!cmd && isCustom) {
				return message.error("general/help:CUSTOM", {
					cmd: args[0]
				});
			} else if (!cmd) {
				return message.error("general/help:NOT_FOUND", {
					search: args[0]
				});
			}

			const description = message.translate(`${cmd.help.category.toLowerCase()}/${cmd.help.name}:DESCRIPTION`);
			const usage = message.translate(`${cmd.help.category.toLowerCase()}/${cmd.help.name}:USAGE`, {
				prefix: message.guild ? data.guild.prefix : ""
			});
			const examples = message.translate(`${cmd.help.category.toLowerCase()}/${cmd.help.name}:EXAMPLES`, {
				prefix: message.guild ? data.guild.prefix : ""
			});

			const groupEmbed = new EmbedBuilder()
				.setAuthor({
					name: message.translate("general/help:CMD_TITLE", {
						cmd: cmd.help.name
					})
				})
				.addFields([
					{
						name: message.translate("general/help:FIELD_DESCRIPTION"),
						value: description
					},
					{
						name: message.translate("general/help:FIELD_USAGE"),
						value: usage
					},
					{
						name: message.translate("general/help:FIELD_EXAMPLES"),
						value: examples
					},
					{
						name: message.translate("general/help:FIELD_ALIASES"),
						value: cmd.help.aliases.length > 0 ? cmd.help.aliases.map(a => "`" + a + "`").join("\n") : message.translate("general/help:NO_ALIAS")
					},
					{
						name: message.translate("general/help:FIELD_PERMISSIONS"),
						value: cmd.conf.memberPermissions.length > 0 ? cmd.conf.memberPermissions.map((p) => `\`${p}\``).join("\n") : message.translate("general/help:NO_REQUIRED_PERMISSION")
					}
				])
				.setColor(data.config.embed.color)
				.setFooter({
					text: data.config.embed.footer
				});

			return message.reply({
				embeds: [groupEmbed]
			});
		}

		const categories = [];
		const commands = this.client.commands;

		commands.forEach((command) => {
			if (!categories.includes(command.help.category)) {
				if (command.help.category === "Owner" && message.author.id !== data.config.owner.id) return;
				categories.push(command.help.category);
			}
		});

		const emojis = this.client.customEmojis;

		const embed = new EmbedBuilder()
			.setDescription(message.translate("general/help:INFO", {
				prefix: message.guild ? data.guild.prefix : ""
			}))
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});
		categories.sort().forEach((cat) => {
			const tCommands = commands.filter((cmd) => cmd.help.category === cat);
			embed.addFields([
				{
					name: `${emojis.categories[cat.toLowerCase()]} ${cat} - (${tCommands.size})`,
					value: `${tCommands.map((cmd) => `\`${cmd.help.name}\``).join(", ")}`
				}
			]);
		});

		embed.addFields([
			{
				name: "\u200B",
				value: message.translate("misc:STATS_FOOTER", {
					dashboardLink: this.client.config.dashboard.baseURL,
					docsLink: `${this.client.config.dashboard.baseURL}/docs/`,
					inviteLink: this.client.generateInvite({ scopes: ["bot", "applications.commands"], permissions: [ PermissionsBitField.Flags.Administrator] }),
					donateLink: "https://qiwi.com/n/JONNYBRO/",
					owner: data.config.owner.id
				})
			}
		]);
		embed.setAuthor({
			name: message.translate("general/help:TITLE", {
				name: this.client.user.username
			}),
			iconURL: this.client.user.displayAvatarURL({
				size: 512,
				format: "png"
			})
		});

		return message.reply({
			embeds: [embed]
		});
	}
}

module.exports = Help;