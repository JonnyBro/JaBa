const { SlashCommandBuilder, range } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Chat extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("chat")
				.setDescription(client.translate("ai/chat:DESCRIPTION"))
				.setDescriptionLocalizations({ "uk": client.translate("ai/chat:DESCRIPTION", null, "uk-UA") })
				.setDMPermission(true)
				.addStringOption(option => option.setName("prompt")
					.setDescription(client.translate("ai/chat:PROMPT"))
					.setDescriptionLocalizations({ "uk": client.translate("ai/chat:PROMPT", null, "uk-UA") })
					.setMaxLength(300)
					.setRequired(true)),
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
	async execute(client, interaction) {
		await interaction.deferReply();

		const prompt = interaction.options.getString("prompt");

		try {
			const completion = await client.openai.createChatCompletion({
					model: "gpt-3.5-turbo",
					messages: [{ role: "user", content: prompt }],
					user: `user${interaction.user.id}`,
				}),
				response = completion.data.choices[0].message.content;

			await interaction.editReply({
				content: interaction.translate("ai/chat:THANKS"),
			});

			if (response.length > 1900) {
				if (response.includes("```")) {
					const parts = response.split("```");

					for (const i in parts) {
						if (i % 2 === 0) {
							await interaction.followUp({
								content: parts[i],
							});
						} else {
							const codeBlock = parts[i].split("\n");
							let formattedCodeBlock = "";

							for (let line in codeBlock) {
								while (line.length > 50) {
									formattedCodeBlock += line.slice(0, 50) + "\n";
									line = line.slice(50, line.length);
								}

								formattedCodeBlock += line + "\n";
							}

							if (formattedCodeBlock.length > 1900 + 100) {
								const codeblockChunks = [];
								for (const i in range({ start: 0, end: formattedCodeBlock.length, step: 1900 })) {
									codeblockChunks.push(formattedCodeBlock.slice(i, i + 1900));
								}

								for (const i in codeblockChunks) {
									await interaction.followUp({ content: `\`\`\`${i}\`\`\`` });
								}

							} else await interaction.followUp({ content: `\`\`\`${formattedCodeBlock}\`\`\`` });
						}
					}
				} else {
					const responseChunks = [];
					for (const i in range({ start: 0, end: response.length, step: 1900 })) {
						responseChunks.push(response.slice(i, i + 1900));
					}

					for (const i in responseChunks) {
						await interaction.followUp({ content: i });
					}
				}
			} else await interaction.followUp({ content: response });
		} catch (e) {
			console.log(e);
		}
	}
}

module.exports = Chat;