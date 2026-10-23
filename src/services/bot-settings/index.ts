import logger from "@/helpers/logger.js";
import BlacklistModel, { BlacklistType } from "@/models/BlacklistModel.js";
import BotSettingsModel from "@/models/BotSettingsModel.js";

const SETTINGS_KEY = "global";

type BotSettings = {
	maintenance: { enabled: boolean; message: string | null };
	status: string | null;
};

// Command validations are synchronous, so everything they check lives in memory and is saved on change
let settings: BotSettings = { maintenance: { enabled: false, message: null }, status: null };
const blacklist = { user: new Set<string>(), guild: new Set<string>() };

export const loadBotSettings = async () => {
	const [doc, entries] = await Promise.all([
		BotSettingsModel.findOne({ key: SETTINGS_KEY }).lean(),
		BlacklistModel.find().lean(),
	]);

	if (doc) settings = { maintenance: doc.maintenance, status: doc.status };

	blacklist.user.clear();
	blacklist.guild.clear();
	for (const entry of entries) blacklist[entry.type].add(entry.id);

	logger.debug(`[Settings] Loaded, ${entries.length} blacklist entries`);
};

export const getBotSettings = () => settings;

export const updateBotSettings = async (changes: Partial<BotSettings>) => {
	settings = { ...settings, ...changes };

	await BotSettingsModel.updateOne({ key: SETTINGS_KEY }, { $set: settings }, { upsert: true });

	return settings;
};

export const isBlacklisted = (type: BlacklistType, id?: string | null) => !!id && blacklist[type].has(id);

export const addToBlacklist = async (type: BlacklistType, id: string, reason: string | null) => {
	await BlacklistModel.updateOne({ type, id }, { $set: { reason } }, { upsert: true });
	blacklist[type].add(id);
};

export const removeFromBlacklist = async (type: BlacklistType, id: string) => {
	await BlacklistModel.deleteOne({ type, id });
	blacklist[type].delete(id);
};
