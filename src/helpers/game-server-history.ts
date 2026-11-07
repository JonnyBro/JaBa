import GameServerSampleModel from "@/models/GameServerSampleModel.js";
import { createCanvas } from "@napi-rs/canvas";
import { Types } from "mongoose";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const HISTORY_RANGES = {
	day: { span: 24 * HOUR, bucket: 10 * MINUTE },
	week: { span: 7 * 24 * HOUR, bucket: HOUR },
} as const;
export type HistoryRange = keyof typeof HISTORY_RANGES;

export const isHistoryRange = (value: unknown): value is HistoryRange =>
	typeof value === "string" && Object.hasOwn(HISTORY_RANGES, value);

/** Peak players in a bucket, null when the server never answered in it. Buckets without checks are left out */
export interface HistoryPoint {
	t: number;
	players: number | null;
}

/** Start of the first bucket, so the last one is the current bucket */
export const historyStart = (range: HistoryRange, now = Date.now()) => {
	const { span, bucket } = HISTORY_RANGES[range];

	return Math.floor(now / bucket) * bucket - span + bucket;
};

export const recordSample = (serverId: Types.ObjectId | string, at: Date, players: number | null) =>
	GameServerSampleModel.create({ serverId, at, players });

export const deleteHistory = (serverId: Types.ObjectId | string) => GameServerSampleModel.deleteMany({ serverId });

export const getHistory = async (serverId: Types.ObjectId | string, range: HistoryRange): Promise<HistoryPoint[]> => {
	const { bucket } = HISTORY_RANGES[range];

	// $dateTrunc counts bins from 2000-01-01, so they line up with buckets counted from the epoch
	const rows = await GameServerSampleModel.aggregate<{ _id: Date; players: number | null }>([
		{
			$match: {
				serverId: new Types.ObjectId(String(serverId)),
				at: { $gte: new Date(historyStart(range)) },
			},
		},
		{
			$group: {
				_id: { $dateTrunc: { date: "$at", unit: "minute", binSize: bucket / MINUTE } },
				players: { $max: "$players" },
			},
		},
		{ $sort: { _id: 1 } },
	]);

	return rows.map(row => ({ t: row._id.getTime(), players: row.players }));
};

export const historyPeak = (points: HistoryPoint[]) => Math.max(0, ...points.map(point => point.players ?? 0));

/** Enough answers to draw a line */
export const hasHistory = (points: HistoryPoint[]) => points.filter(point => point.players !== null).length >= 2;

const WIDTH = 800;
const HEIGHT = 200;
const PAD = 10;
const OFFLINE_BAR = 6;
const GREEN = "#57F287";
const RED = "#ED4245";

/** No text on purpose, the Docker image has no fonts. The caption goes into the message instead */
export const drawHistory = (points: HistoryPoint[], range: HistoryRange = "day") => {
	const { span, bucket } = HISTORY_RANGES[range];
	const slots = span / bucket;
	const start = historyStart(range);

	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext("2d");

	const plotBottom = HEIGHT - PAD - OFFLINE_BAR - 4;
	const plotHeight = plotBottom - PAD;
	const step = (WIDTH - PAD * 2) / (slots - 1);
	const top = Math.max(1, historyPeak(points)) * 1.15;
	const x = (t: number) => PAD + ((t - start) / bucket) * step;
	const y = (players: number) => plotBottom - (players / top) * plotHeight;

	ctx.strokeStyle = "rgba(128, 128, 128, 0.3)";
	ctx.lineWidth = 1;
	for (let i = 0; i <= 4; i++) {
		const lineX = PAD + ((WIDTH - PAD * 2) * i) / 4;
		ctx.beginPath();
		ctx.moveTo(lineX, PAD);
		ctx.lineTo(lineX, plotBottom);
		ctx.stroke();
	}

	ctx.beginPath();
	ctx.moveTo(PAD, plotBottom);
	ctx.lineTo(WIDTH - PAD, plotBottom);
	ctx.stroke();

	const peak = historyPeak(points);
	if (peak > 0) {
		ctx.setLineDash([6, 6]);
		ctx.beginPath();
		ctx.moveTo(PAD, y(peak));
		ctx.lineTo(WIDTH - PAD, y(peak));
		ctx.stroke();
		ctx.setLineDash([]);
	}

	// A gap in the checks or an offline bucket breaks the line
	const runs: { t: number; players: number }[][] = [];
	let previous: number | null = null;
	for (const point of points) {
		if (point.players === null) {
			previous = null;
			continue;
		}

		if (previous === null || point.t - previous > bucket) runs.push([]);
		runs.at(-1)!.push({ t: point.t, players: point.players });
		previous = point.t;
	}

	const gradient = ctx.createLinearGradient(0, PAD, 0, plotBottom);
	gradient.addColorStop(0, "rgba(87, 242, 135, 0.4)");
	gradient.addColorStop(1, "rgba(87, 242, 135, 0.03)");

	for (const run of runs) {
		// A lone point gets a bucket wide so it's still visible
		const line = run.length > 1 ? run : [run[0], { t: run[0].t + bucket * 0.8, players: run[0].players }];

		ctx.beginPath();
		ctx.moveTo(x(line[0].t), plotBottom);
		for (const point of line) ctx.lineTo(x(point.t), y(point.players));
		ctx.lineTo(x(line.at(-1)!.t), plotBottom);
		ctx.closePath();
		ctx.fillStyle = gradient;
		ctx.fill();

		ctx.beginPath();
		line.forEach((point, i) =>
			i ? ctx.lineTo(x(point.t), y(point.players)) : ctx.moveTo(x(point.t), y(point.players)),
		);
		ctx.strokeStyle = GREEN;
		ctx.lineWidth = 3;
		ctx.lineJoin = "round";
		ctx.lineCap = "round";
		ctx.stroke();
	}

	ctx.fillStyle = RED;
	for (const point of points)
		if (point.players === null)
			ctx.fillRect(x(point.t) - step / 2, HEIGHT - PAD - OFFLINE_BAR, Math.max(step, 2), OFFLINE_BAR);

	return canvas.toBuffer("image/png");
};
