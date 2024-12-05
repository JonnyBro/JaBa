import { SlashCommandBuilder } from "discord.js";
import Command from "../../base/newCommand.js";

export default new Command({
	data: new SlashCommandBuilder().setName("8ball").setDescription("8ball"),
	execute(interaction) {
		console.log("8ball");
		interaction.reply("8ball");
	},
});
