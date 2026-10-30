import { currentLocale } from "@/i18n";

// Reading currentLocale inside the functions keeps templates reactive to the site language
const formatters = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>();

const cached = <T extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>(
	key: string,
	create: (locale: string) => T,
) => {
	const locale = currentLocale.value;
	const id = `${locale}:${key}`;

	let formatter = formatters.get(id) as T | undefined;
	if (!formatter) {
		formatter = create(locale);
		formatters.set(id, formatter);
	}
	return formatter;
};

const numberFormat = () => cached("number", l => new Intl.NumberFormat(l));
const compactFormat = () =>
	cached("compact", l => new Intl.NumberFormat(l, { notation: "compact", maximumFractionDigits: 1 }));
const dateFormat = () =>
	cached("date", l => new Intl.DateTimeFormat(l, { year: "numeric", month: "short", day: "numeric" }));
const dateTimeFormat = () =>
	cached(
		"datetime",
		l =>
			new Intl.DateTimeFormat(l, {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			}),
	);
const relativeFormat = () => cached("relative", l => new Intl.RelativeTimeFormat(l, { numeric: "auto" }));

export const formatNumber = (n: number | null | undefined) =>
	n === null || n === undefined ? "—" : numberFormat().format(n);
export const formatCompact = (n: number | null | undefined) =>
	n === null || n === undefined ? "—" : n < 10000 ? numberFormat().format(n) : compactFormat().format(n);

export const formatDate = (timestamp: number | null | undefined) => (timestamp ? dateFormat().format(timestamp) : "—");

export const formatDateTime = (timestamp: number | null | undefined) =>
	timestamp ? dateTimeFormat().format(timestamp) : "—";

const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
	["year", 365 * 24 * 3600],
	["month", 30 * 24 * 3600],
	["week", 7 * 24 * 3600],
	["day", 24 * 3600],
	["hour", 3600],
	["minute", 60],
];

export const formatTrackTime = (ms: number) => {
	const total = Math.max(0, Math.floor(ms / 1000));
	const pad = (n: number) => String(n).padStart(2, "0");
	const [h, m, s] = [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60];

	return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

export const formatDuration = (ms: number | null | undefined) => {
	if (!ms) return "—";

	const minutes = Math.floor(ms / 60_000);
	const parts = [
		[Math.floor(minutes / 1440), "d"],
		[Math.floor(minutes / 60) % 24, "h"],
		[minutes % 60, "m"],
	] as const;

	return (
		parts
			.filter(([value]) => value)
			.map(([value, unit]) => `${value}${unit}`)
			.join(" ") || "0m"
	);
};

export const formatRelative = (timestamp: number | null | undefined) => {
	if (!timestamp) return "—";

	const seconds = (timestamp - Date.now()) / 1000;
	for (const [unit, size] of units) {
		if (Math.abs(seconds) >= size) return relativeFormat().format(Math.round(seconds / size), unit);
	}
	return relativeFormat().format(0, "second");
};

export const initials = (name: string) =>
	name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(part => part[0].toUpperCase())
		.join("") || "?";
