import { componentRouter } from "@/utils/component-router.js";
import { BaseInteraction } from "discord.js";

export const data = {
	name: "interactionCreate",
	once: false,
};

export async function run(interaction: BaseInteraction) {
	await componentRouter.handle(interaction);
}
