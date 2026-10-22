import { buildAvatarPanel } from "@/helpers/avatar.js";
import { UserContextCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	ContextMenuCommandBuilder,
	GuildMember,
	InteractionContextType,
} from "discord.js";

const client = useClient();

export const data = new ContextMenuCommandBuilder()
	.setName(client.i18n.translate("general/avatar:CONTEXT_NAME", { lng: "en-US" }))
	.setNameLocalizations({
		ru: client.i18n.translate("general/avatar:CONTEXT_NAME", { lng: "ru-RU" }),
	})
	.setType(ApplicationCommandType.User)
	.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
	.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild]);

export const run = async ({ interaction }: UserContextCommandProps) => {
	const member = interaction.targetMember instanceof GuildMember ? interaction.targetMember : null;

	await interaction.reply(await buildAvatarPanel(interaction, interaction.targetUser, member));
};
