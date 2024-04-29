const { ContextMenuCommandBuilder, ApplicationCommandType, PermissionsBitField } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class PlayContext extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor() {
		super({
			command: new ContextMenuCommandBuilder()
				.setName("Add to Queue")
				.setType(ApplicationCommandType.Message)
				.setDMPermission(false),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").MessageContextMenuCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const links = interaction.targetMessage.content.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g);
		if (!links) return interaction.error("music/play:NO_LINK", null, { edit: true });

		const query = links[0],
			voice = interaction.member.voice;
		if (!voice.channel) return interaction.error("music/play:NO_VOICE_CHANNEL", null, { edit: true });

		const perms = voice.channel.permissionsFor(client.user);
		if (!perms.has(PermissionsBitField.Flags.Connect) || !perms.has(PermissionsBitField.Flags.Speak)) return interaction.error("music/play:VOICE_CHANNEL_CONNECT", null, { edit: true });

		const player = await client.lavalink.createPlayer({
			guildId: interaction.guildId,
			voiceChannelId: voice.channelId,
			textChannelId: interaction.channelId,
			selfDeaf: true,
			selfMute: false,
			volume: 100,
		});

		await player.connect();

		const res = await player.search({ query }, interaction.member);

		if (res.loadType === "playlist") await player.queue.add(res.tracks);
		else if (res.loadType === "search") await player.queue.add(res.tracks[0]);
		else if (res.loadType === "track") await player.queue.add(res.tracks[0]);
		else console.log(res);

		if (!player.playing) await player.play();

		interaction.editReply({
			content: interaction.translate("music/play:ADDED_QUEUE", {
				songName: res.loadType === "playlist" ? res.playlist.name : `${res.tracks[0].info.title} - ${res.tracks[0].info.author}`,
			}),
		});
	}
}

module.exports = PlayContext;
