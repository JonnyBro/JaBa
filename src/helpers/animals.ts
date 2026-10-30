import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { componentRouter } from "@/utils/component-router.js";
import { createContainer, createSeparator } from "@/utils/create-container.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
} from "discord.js";

const ANIMAL_REROLL_ID = "ANIMAL_REROLL";

type ImageList = Array<{ url?: string }>;

const ANIMAL_APIS = {
	cat: { url: "https://api.thecatapi.com/v1/images/search", image: (data: ImageList) => data[0]?.url },
	dog: { url: "https://api.thedogapi.com/v1/images/search", image: (data: ImageList) => data[0]?.url },
	fox: { url: "https://randomfox.ca/floof/", image: (data: { image?: string }) => data.image },
	duck: {
		url: "https://random-d.uk/api/v2/random",
		image: (data: { url?: string }) => data.url?.replace(/^http:/, "https:"),
	},
};

export type Animal = keyof typeof ANIMAL_APIS;

const fetchImage = async (animal: Animal) => {
	const api = ANIMAL_APIS[animal];

	try {
		const data = await fetch(api.url).then(r => r.json());

		return (api.image as (data: unknown) => string | undefined)(data) || null;
	} catch (error) {
		logger.warn(`Failed to fetch a random ${animal}:`, error);

		return null;
	}
};

export const buildAnimalPanel = async (animal: Animal) => {
	const url = await fetchImage(animal);
	if (!url) return null;

	const container = createContainer()
		.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)))
		.addSeparatorComponents(createSeparator(false))
		.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`${ANIMAL_REROLL_ID}:${animal}`)
					.setEmoji("🔄")
					.setStyle(ButtonStyle.Secondary),
			),
		);

	return {
		flags: MessageFlags.IsComponentsV2 as const,
		components: [container],
	};
};

componentRouter.register(ANIMAL_REROLL_ID, async interaction => {
	if (!interaction.isButton()) return;

	if (interaction.message.interactionMetadata?.user.id !== interaction.user.id) {
		await interaction.reply({
			content: await translateContext(interaction, "misc:CANT_YOU"),
			flags: MessageFlags.Ephemeral,
		});

		return;
	}

	await interaction.deferUpdate();

	const panel = await buildAnimalPanel(interaction.customId.split(":")[1] as Animal);

	if (panel) await interaction.editReply(panel);
	else
		await interaction.followUp({
			content: await translateContext(interaction, "misc:UNKNOWN_ERROR"),
			flags: MessageFlags.Ephemeral,
		});
});
