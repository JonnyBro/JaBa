import { getNoun } from "@/helpers/functions.js";
import { getBotSettings } from "@/services/bot-settings/index.js";
import useClient from "@/utils/use-client.js";
import { ActivityType } from "discord.js";

const ROTATION_INTERVAL = 30_000;

let index = 0;

const getRotation = () => {
	const client = useClient();
	const count = client.guilds.cache.size;

	return [
		"Use /help to see all the commands!",
		`I'm in ${count} ${getNoun(count, [
			client.i18n.translate("misc:NOUNS:SERVER:1"),
			client.i18n.translate("misc:NOUNS:SERVER:2"),
			client.i18n.translate("misc:NOUNS:SERVER:5"),
		])}!`,
	];
};

export const applyPresence = () => {
	const { status } = getBotSettings();
	const rotation = getRotation();
	const state = status ?? rotation[index++ % rotation.length];

	useClient().user.setActivity({ type: ActivityType.Custom, name: "custom", state });
};

export const startPresenceRotation = () => {
	applyPresence();
	setInterval(applyPresence, ROTATION_INTERVAL);
};
