import { PROJECT_ROOT } from "@/constants/index.js";
import logger from "@/helpers/logger.js";
import AudioFileModel, { IAudioFileSchema } from "@/models/AudioFileModel.js";
import PlaylistModel, { PlaylistTrack } from "@/models/PlaylistModel.js";
import useClient from "@/utils/use-client.js";
import { Track } from "lavalink-client";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

export const STORAGE_QUOTA = 100 * 1024 * 1024;
export const FILE_TTL = 14 * 24 * 60 * 60 * 1000;
export const AUDIO_EXTENSIONS = ["mp3", "ogg", "opus", "flac", "wav", "m4a", "aac", "webm", "mka", "mp4"];

export const UPLOAD_SOURCE = "upload";

const DEFAULT_PORT = 6548;

export const getUploadsDir = async () => {
	const dir = useClient().configService.get<string>("UPLOADS_DIR") || join(PROJECT_ROOT, "..", "uploads");
	await mkdir(dir, { recursive: true });

	return dir;
};

export const getFilePath = async (file: Pick<IAudioFileSchema, "_id">) =>
	join(await getUploadsDir(), file._id.toString());

/** Lavalink downloads the files from the bot, so this is the address it can reach, not the public one */
export const getFileUrl = (file: Pick<IAudioFileSchema, "token">) => {
	const config = useClient().configService;
	const base =
		config.get<string>("DASHBOARD_INTERNAL_URL") ||
		`http://localhost:${Number(config.get<string>("DASHBOARD_PORT")) || DEFAULT_PORT}`;

	return `${base.replace(/\/+$/, "")}/files/${file.token}`;
};

export const getUsedStorage = async (userId: string) => {
	const [result] = await AudioFileModel.aggregate<{ size: number }>([
		{ $match: { userId, expiredAt: null } },
		{ $group: { _id: null, size: { $sum: "$size" } } },
	]);

	return result?.size ?? 0;
};

export const getFileExpiry = (file: Pick<IAudioFileSchema, "lastPlayedAt">) =>
	new Date(file.lastPlayedAt.getTime() + FILE_TTL);

export const markFilePlayed = (fileId: string) =>
	AudioFileModel.updateOne({ _id: fileId, expiredAt: null }, { lastPlayedAt: new Date() }).catch(error =>
		logger.warn(`[Files] Failed to update the last play of ${fileId}:`, error),
	);

const deleteFromDisk = async (file: Pick<IAudioFileSchema, "_id">) =>
	rm(await getFilePath(file), { force: true }).catch(error =>
		logger.warn(`[Files] Failed to delete ${file._id} from the disk:`, error),
	);

export const deleteFile = async (file: Pick<IAudioFileSchema, "_id">) => {
	await deleteFromDisk(file);
	await AudioFileModel.deleteOne({ _id: file._id });
};

export const releaseFiles = async (userId: string, fileIds: (string | undefined)[]) => {
	const ids = [...new Set(fileIds.filter((id): id is string => !!id))];
	if (!ids.length) return;

	const used = new Set(
		(await PlaylistModel.find({ userId, "tracks.fileId": { $in: ids } }, { tracks: 1 }).lean()).flatMap(p =>
			p.tracks.map(t => t.fileId),
		),
	);

	for (const file of await AudioFileModel.find({ _id: { $in: ids.filter(id => !used.has(id)) } }))
		await deleteFile(file);
};

export const getFilesById = async (fileIds: (string | undefined)[]) => {
	const ids = fileIds.filter((id): id is string => !!id && /^[a-f\d]{24}$/i.test(id));
	const files = ids.length ? await AudioFileModel.find({ _id: { $in: ids } }).lean() : [];

	return new Map(files.map(file => [file._id.toString(), file]));
};

/**
 * Files are resolved again on every play instead of using the saved encoded track, the encoded one has
 * the download address in it and breaks once DASHBOARD_INTERNAL_URL or the port changes
 */
export const resolveFileTrack = async (track: PlaylistTrack, file: IAudioFileSchema, requester: unknown) => {
	const node = useClient().lavalink.nodeManager.leastUsedNodes("playingPlayers")[0];
	if (!node) return null;

	const res = await node.search({ query: getFileUrl(file) }, requester).catch(() => null);
	const resolved = res?.tracks[0] as Track | undefined;
	if (!resolved?.encoded) return null;

	return useClient().lavalink.utils.buildTrack(
		{
			encoded: resolved.encoded,
			info: {
				...resolved.info,
				title: track.info.title,
				author: track.info.author,
				sourceName: UPLOAD_SOURCE as Track["info"]["sourceName"],
				// The real address has the download token in it and must not end up in chat
				uri: "",
			},
			pluginInfo: resolved.pluginInfo,
			userData: { fileId: file._id.toString() },
		},
		requester,
	);
};

export const expireInactiveFiles = async () => {
	const files = await AudioFileModel.find({
		expiredAt: null,
		lastPlayedAt: { $lt: new Date(Date.now() - FILE_TTL) },
	});

	for (const file of files) {
		await deleteFromDisk(file);
		await AudioFileModel.updateOne({ _id: file._id }, { expiredAt: new Date() });
	}

	// Leftovers of uploads that failed halfway or of playlists removed while the bot was down
	const used = new Set((await PlaylistModel.distinct("tracks.fileId")).map(String));
	const orphans = await AudioFileModel.find({
		_id: { $nin: [...used].filter(id => /^[a-f\d]{24}$/i.test(id)) },
		createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) },
	});

	for (const file of orphans) await deleteFile(file);

	return { expired: files.length, orphans: orphans.length };
};
