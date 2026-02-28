import useClient from "@/utils/use-client.js";
import {
	BaseInteraction,
	CacheType,
	Guild,
	GuildMember,
	Interaction,
	InteractionReplyOptions,
	Locale,
	Message,
	MessageFlags,
	User,
} from "discord.js";

interface Options extends InteractionReplyOptions {
	prefixEmoji?: string;
	locale?: string;
	edit?: boolean;
	ephemeral?: boolean;
	mention?: boolean;
}

// According to https://discord.com/developers/docs/reference#locales
const localeExcludes = ["en", "es", "pt", "sv", "zh"];

const getAppEmojis = () => {
	const client = useClient();
	return client.application.emojis.cache;
};

export const formatReply = (message: string, prefixEmoji?: string) => {
	const emojis = getAppEmojis();
	const emoji = emojis.find(emoji => emoji.name === prefixEmoji) || ":white_small_square:";
	return prefixEmoji ? `${emoji.toString()} ${message}` : `${message}`;
};

export const asyncForEach = async <T>(collection: T[], callback: (item: T) => Promise<void>) => {
	for (const item of collection) await callback(item);
};

export const translateContext = async <T extends CacheType = CacheType>(
	context: string | Interaction<T> | Message | Guild,
	key: string,
	args?: Record<string, unknown> | null,
	options?: Options,
) => {
	const client = useClient();

	const localeResolvers = {
		string: (ctx: string) => getLocale(ctx),
		Guild: (ctx: Guild) => getLocale(ctx.id),
		default: () => client.configService.get<string>("defaultLang"),
	};

	const getLocaleFromContext = async (): Promise<string> => {
		if (typeof context === "string") return localeResolvers.string(context);
		if (context instanceof Guild) return localeResolvers.Guild(context);
		if ("guild" in context && context.guild) return localeResolvers.string(context.guild.id);

		return localeResolvers.default();
	};

	const locale = options?.locale || (await getLocaleFromContext());

	return client.i18n.translate(key, { lng: locale, ...args });
};

export const replyTranslated = async <T extends CacheType = CacheType>(
	context: Interaction<T> | Message,
	key: string,
	args?: Record<string, unknown> | null,
	options?: Options,
) => {
	const translated = await translateContext(context, key, args, options);
	const content = formatReply(translated, options?.prefixEmoji);

	if (context instanceof BaseInteraction) {
		if (!context.isRepliable()) return;

		if (options?.edit) return await context.editReply({ content });

		await context.reply({
			content,
			flags: options?.ephemeral ? MessageFlags.Ephemeral : undefined,
		});

		return;
	}

	if (options?.edit)
		return await context.edit({
			content,
			allowedMentions: { repliedUser: options.mention || false },
		});

	await context.reply({
		content,
		allowedMentions: { repliedUser: options?.mention || false },
	});
};

export const editReplyError = async <T extends CacheType = CacheType>(
	context: Interaction<T> | Message,
	key: string,
	args?: Record<string, unknown> | null,
	options: Options = { prefixEmoji: "error", edit: true },
) => await replyError(context, key, args, { edit: true, ...options });

export const editReplySuccess = async <T extends CacheType = CacheType>(
	context: Interaction<T> | Message,
	key: string,
	args?: Record<string, unknown> | null,
	options: Options = { prefixEmoji: "success", edit: true },
) => await replySuccess(context, key, args, { edit: true, ...options });

export const replyError = async <T extends CacheType = CacheType>(
	context: Interaction<T> | Message,
	key: string,
	args?: Record<string, unknown> | null,
	options: Options = { prefixEmoji: "error" },
) => await replyTranslated(context, key, args, { prefixEmoji: "error", ...options });

export const replySuccess = async <T extends CacheType = CacheType>(
	context: Interaction<T> | Message,
	key: string,
	args?: Record<string, unknown> | null,
	options: Options = { prefixEmoji: "success" },
) => await replyTranslated(context, key, args, { prefixEmoji: "success", ...options });

export const getLocale = async (guildId: string) => {
	const client = useClient();
	const guild = await client.getGuildData(guildId);
	return guild.language;
};

export const getLocalizedDesc = (key: string) => {
	const client = useClient();

	const locals = client.i18n.SupportedLanguages.reduce(
		(acc, lng) => {
			const splitted = lng.split("-")[0];
			const short = localeExcludes.includes(splitted) ? lng : splitted;
			acc[short as Locale] = client.i18n.translate(key, { lng });

			return acc;
		},
		{} as Record<Locale, string | null>,
	);

	return {
		description: client.i18n.translate(key),
		// eslint-disable-next-line camelcase
		description_localizations: locals,
	};
};

export const getNoun = (number: number, wordForms: string[]) => {
	if (!Array.isArray(wordForms) || wordForms.length !== 3)
		throw new Error("wordForms should be an array with three elements: [one, two, five]");

	const [one, two, five] = wordForms;
	let n = Math.abs(number);
	n %= 100;
	if (n >= 5 && n <= 20) return five;
	n %= 10;
	if (n === 1) return one;
	if (n >= 2 && n <= 4) return two;
	return five;
};

export const getUsername = (arg: User | GuildMember): string => {
	// NOTE: Bots still have discriminators
	if (arg instanceof GuildMember) return arg.user.discriminator !== "0" ? arg.user.tag : arg.user.username;

	return arg.discriminator !== "0" ? arg.tag : arg.username;
};

export const getXpForNextLevel = (level: number): number => 5 * level * level + 80 * level + 100;

export const printDate = (date: Date | number, locale: Intl.LocalesArgument = "en-US") =>
	new Intl.DateTimeFormat(locale).format(date);

export const randomNum = (min: number = 0, max: number = 100) => Math.floor(Math.random() * (max - min + 1)) + min;

export const shuffle = <T>(array: readonly T[]): T[] => {
	const shuffled = [...array];

	// Fisher-Yates shuffle algorithm
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return shuffled;
};

export const formatTime = (time: number) => (time < 10 ? `0${time}` : time);

export const convertTime = (duration: number) => {
	const hours = Math.floor(duration / 3_600_000);
	const minutes = Math.floor((duration % 3_600_000) / 60_000);
	const seconds = Math.floor((duration % 60_000) / 1_000);
	const formattedHours = formatTime(hours);
	const formattedMinutes = formatTime(minutes);
	const formattedSeconds = formatTime(seconds);

	return duration < 3_600_000
		? `${formattedMinutes}:${formattedSeconds}`
		: `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};

export const formatString = (str: string, maxLength: number) =>
	str.length > maxLength ? str.slice(0, maxLength - 3) + "..." : str;

export const capitalizeString = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
