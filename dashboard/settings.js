const SoftUI = require("./dashboard-core/theme/dbd-soft-ui"),
	DBD = require("./dashboard-core/index");

const { PermissionsBitField, ChannelType } = require("discord.js");

module.exports = client => [
	{
		categoryId: "main",
		categoryName: "Main settings",
		categoryDescription: "Setup your bot here!",
		categoryPermissions: PermissionsBitField.Flags.ManageGuild,
		categoryOptionsList: [
			{
				optionId: "lang",
				optionName: "Language",
				optionDescription: "Change bot's language on the server",
				optionType: DBD.formTypes.select({
					English: "en-US",
					Russian: "ru-RU",
					Ukrainian: "uk-UA",
				}),
				getActualSet: async ({ guild }) => {
					const guildData = await client.findOrCreateGuild(guild.id);

					return guildData.language;
				},
				setNew: async ({ guild, newData }) => {
					const guildData = await client.findOrCreateGuild(guild.id);

					guildData.language = newData;

					guildData.markModified();
					await guildData.save();

					return;
				},
			},
			{
				optionId: "welcome",
				optionName: "Welcome Message",
				optionDescription: "Setup welcome message on the server",
				optionType: SoftUI.formTypes.multiRow([
					{
						optionId: "welcome_enable",
						optionName: "Enabled",
						optionDescription: "Toggle welcome messages sending",
						optionType: DBD.formTypes.switch(),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.welcome.enabled;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.welcome.enabled = newData;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
					{
						optionId: "welcome_image",
						optionName: "Add Image",
						optionDescription: "Toggle sending an image with welcome message",
						optionType: DBD.formTypes.switch(),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.welcome.withImage;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.welcome.withImage = newData;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
					{
						optionId: "welcome_message",
						optionName: "Message",
						optionDescription: "Change welcome message (You can use {user}, {server} and {membercount} wildcards)",
						optionType: DBD.formTypes.input("Welcome, {user}!", 2, 100, false, false),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.welcome.message;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.welcome.message = newData !== "" ? newData : null;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
					{
						optionId: "welcome_channel",
						optionName: "Channel",
						optionDescription: "Select a channel for welcome messages",
						optionType: DBD.formTypes.channelsSelect(false, [ChannelType.GuildText]),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.welcome.channel;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.welcome.channel = newData !== "" ? newData : null;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
				]),
			},
			{
				optionId: "goodbye",
				optionName: "Goodbye Message",
				optionDescription: "Setup goodbye message on the server",
				optionType: SoftUI.formTypes.multiRow([
					{
						optionId: "goodbye_enable",
						optionName: "Enabled",
						optionDescription: "Toggle goodbye messages sending",
						optionType: DBD.formTypes.switch(),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.goodbye.enabled;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.goodbye.enabled = newData;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
					{
						optionId: "goodbye_image",
						optionName: "Add Image",
						optionDescription: "Toggle sending an image with goodbye message",
						optionType: DBD.formTypes.switch(),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.goodbye.withImage;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.goodbye.withImage = newData;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
					{
						optionId: "goodbye_message",
						optionName: "Message",
						optionDescription: "Change goodbye message (You can use {user}, {server} and {membercount} wildcards)",
						optionType: DBD.formTypes.input("goodbye, {user}!", 2, 100, false, false),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.goodbye.message;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.goodbye.message = newData !== "" ? newData : null;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
					{
						optionId: "goodbye_channel",
						optionName: "Channel",
						optionDescription: "Select a channel for goodbye messages",
						optionType: DBD.formTypes.channelsSelect(false, [ChannelType.GuildText]),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.goodbye.channel;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.goodbye.channel = newData !== "" ? newData : null;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
				]),
			},
			{
				optionId: "autorole",
				optionName: "Auto Role",
				optionDescription: "Setup auto role on the server",
				optionType: SoftUI.formTypes.multiRow([
					{
						optionId: "autorole_enable",
						optionName: "Enabled",
						optionDescription: "Toggle auto role granting for new members",
						optionType: DBD.formTypes.switch(),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.autorole.enabled;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.autorole.enabled = newData;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
					{
						optionId: "autorole_role",
						optionName: "Role",
						optionDescription: "Select a role for auto role. Select \"-\" to disable",
						optionType: DBD.formTypes.rolesSelect(false, false, true),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.autorole.role;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.autorole.role = newData !== "" ? newData : null;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
				]),
			},
			{
				optionId: "automod",
				optionName: "Auto Mod",
				optionDescription: "Setup auto mod on the server",
				optionType: SoftUI.formTypes.multiRow([
					{
						optionId: "automod_enable",
						optionName: "Enabled",
						optionDescription: "Toggle auto mod. It will remove invite links from non-moderators",
						optionType: DBD.formTypes.switch(),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.automod.enabled;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.automod.enabled = newData;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
					{
						optionId: "automod_ignore",
						optionName: "Ignore Channels",
						optionDescription: "Select a channels for auto mod to ignore",
						optionType: DBD.formTypes.channelsMultiSelect(false, false, [ChannelType.GuildText]),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.automod.ignored;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.automod.ignored = newData;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
				]),
			},
			{
				optionId: "monitoring",
				optionName: "Monitoring Channels",
				optionDescription: "Setup monitoring channels on the server",
				optionType: SoftUI.formTypes.multiRow([
					{
						optionId: "monitoring_messageupdate",
						optionName: "Message Update Channel",
						optionDescription: "Select a channel for messages update logs to go to. Select \"-\" to disable",
						optionType: DBD.formTypes.channelsSelect(false, [ChannelType.GuildText]),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins?.monitoring?.messageUpdate;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							if (guildData.plugins.monitoring === undefined) guildData.plugins.monitoring = {};

							guildData.plugins.monitoring.messageUpdate = newData !== "" ? newData : null;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
					{
						optionId: "monitoring_messagedelete",
						optionName: "Message Deletion Channel",
						optionDescription: "Select a channel for messages deletion logs to go to. Select \"-\" to disable",
						optionType: DBD.formTypes.channelsSelect(false, [ChannelType.GuildText]),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins?.monitoring?.messageDelete;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							if (guildData.plugins.monitoring === undefined) guildData.plugins.monitoring = {};

							guildData.plugins.monitoring.messageDelete = newData !== "" ? newData : null;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
				]),
			},
			{
				optionId: "channels",
				optionName: "Special Channels",
				optionDescription: "Setup special channels on the server. Select \"-\" to disable",
				optionType: SoftUI.formTypes.multiRow([
					{
						optionId: "channels_suggestions",
						optionName: "Suggestions Channel",
						optionDescription: "Select a channel for suggestions to go to",
						optionType: DBD.formTypes.channelsSelect(false, [ChannelType.GuildText]),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.suggestions;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.suggestions = newData !== "" ? newData : null;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
					{
						optionId: "channels_reports",
						optionName: "Reports Channel",
						optionDescription: "Select a channel for reports to go to. Select \"-\" to disable",
						optionType: DBD.formTypes.channelsSelect(false, [ChannelType.GuildText]),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.reports;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.reports = newData !== "" ? newData : null;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
					{
						optionId: "channels_birthdays",
						optionName: "Birthdays Channel",
						optionDescription: "Select a channel for birthdays message to go to. Select \"-\" to disable",
						optionType: DBD.formTypes.channelsSelect(false, [ChannelType.GuildText]),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.birthdays;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.birthdays = newData !== "" ? newData : null;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
					{
						optionId: "channels_modlogs",
						optionName: "Moderation Logs Channel",
						optionDescription: "Select a channel for moderation logs to go to (warns). Select \"-\" to disable",
						optionType: DBD.formTypes.channelsSelect(false, [ChannelType.GuildText]),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							return guildData.plugins.modlogs;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild(guild.id);

							guildData.plugins.modlogs = newData !== "" ? newData : null;

							guildData.markModified("plugins");
							await guildData.save();

							return;
						},
					},
				]),
			},
		],
	},
	{
		categoryId: "test",
		categoryName: "test settings",
		categoryDescription: "ooga booba",
		categoryPermissions: PermissionsBitField.Flags.ViewChannel,
		categoryOptionsList: [
			{
				optionType: DBD.formTypes.embedBuilder({
					username: "JaBa",
					avatarURL: "https://cdn.discordapp.com/avatars/708637495054565426/af98d49ebc9bf28b40b45ed5a0a623b4.png?size=4096",
				}),
			},
		],
	},
];
