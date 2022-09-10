import { User } from "discord.js";
import { Player } from "../Player";
import { RawTrackData, TrackJSON } from "../types/types";
import { Playlist } from "./Playlist";
import { Queue } from "./Queue";
declare class Track {
    player: Player;
    title: string;
    description: string;
    author: string;
    url: string;
    thumbnail: string;
    duration: string;
    views: number;
    requestedBy: User;
    playlist?: Playlist;
    readonly raw: RawTrackData;
    readonly id: string;
    /**
     * Track constructor
     * @param {Player} player The player that instantiated this Track
     * @param {RawTrackData} data Track data
     */
    constructor(player: Player, data: RawTrackData);
    private _patch;
    /**
     * The queue in which this track is located
     * @type {Queue}
     */
    get queue(): Queue;
    /**
     * The track duration in millisecond
     * @type {number}
     */
    get durationMS(): number;
    /**
     * Returns source of this track
     * @type {TrackSource}
     */
    get source(): import("../types/types").TrackSource;
    /**
     * String representation of this track
     * @returns {string}
     */
    toString(): string;
    /**
     * Raw JSON representation of this track
     * @returns {TrackJSON}
     */
    toJSON(hidePlaylist?: boolean): TrackJSON;
}
export default Track;
export { Track };
