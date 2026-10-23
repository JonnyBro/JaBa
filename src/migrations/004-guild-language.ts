import logger from "@/helpers/logger.js";
import useClient from "@/utils/use-client.js";
import { Migration } from "./types.js";

const SUPPORTED_LANGUAGES = ["en-US", "ru-RU"];

export default {
	id: "004-guild-language",
	description: "Replace unsupported guild languages with the default one",
	up: async db => {
		const defaultLang = useClient().configService.get<string>("DEFAULT_LANG");

		const result = await db
			.collection("guilds")
			.updateMany({ language: { $nin: SUPPORTED_LANGUAGES } }, { $set: { language: defaultLang } });

		logger.info(
			`[Migrations] Set ${defaultLang} for ${result.modifiedCount} guild(s) with an unsupported language`,
		);
	},
} satisfies Migration;
