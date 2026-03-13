import { BaseInteraction } from "discord.js";

type ComponentHandler = (interaction: BaseInteraction) => Promise<void>;

class ComponentRouter {
	private handlers = new Map<string, ComponentHandler>();

	register(prefix: string, handler: ComponentHandler) {
		this.handlers.set(prefix, handler);
	}

	async handle(interaction: BaseInteraction) {
		if (!interaction.isMessageComponent()) return;

		for (const [prefix, handler] of this.handlers)
			if (interaction.customId.includes(prefix)) return handler(interaction);
	}
}

export const componentRouter = new ComponentRouter();
