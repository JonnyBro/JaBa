/// <reference types="node" />
/// <reference types="node" />
import { Collection, Guild, GuildChannelResolvable } from "discord.js";
import { Player } from "../Player";
import { StreamDispatcher } from "../VoiceInterface/StreamDispatcher";
import Track from "./Track";
import { PlayerOptions, PlayerProgressbarOptions, PlayOptions, QueueFilters, QueueRepeatMode, TrackSource } from "../types/types";
import type { Readable } from "stream";
declare class Queue<T = unknown> {
    #private;
    readonly guild: Guild;
    readonly player: Player;
    connection: StreamDispatcher;
    tracks: Track[];
    previousTracks: Track[];
    options: PlayerOptions;
    playing: boolean;
    metadata?: T;
    repeatMode: QueueRepeatMode;
    readonly id: string;
    private _streamTime;
    _cooldownsTimeout: Collection<string, NodeJS.Timeout>;
    private _activeFilters;
    private _filtersUpdate;
    onBeforeCreateStream: (track: Track, source: TrackSource, queue: Queue) => Promise<Readable | undefined>;
    /**
     * Queue constructor
     * @param {Player} player The player that instantiated this queue
     * @param {Guild} guild The guild that instantiated this queue
     * @param {PlayerOptions} [options] Player options for the queue
     */
    constructor(player: Player, guild: Guild, options?: PlayerOptions);
    /**
     * Returns current track
     * @type {Track}
     */
    get current(): Track;
    /**
     * If this queue is destroyed
     * @type {boolean}
     */
    get destroyed(): boolean;
    /**
     * Returns current track
     * @returns {Track}
     */
    nowPlaying(): Track;
    /**
     * Connects to a voice channel
     * @param {GuildChannelResolvable} channel The voice/stage channel
     * @returns {Promise<Queue>}
     */
    connect(channel: GuildChannelResolvable): Promise<this>;
    /**
     * Destroys this queue
     * @param {boolean} [disconnect=this.options.leaveOnStop] If it should leave on destroy
     * @returns {void}
     */
    destroy(disconnect?: boolean): void;
    /**
     * Skips current track
     * @returns {boolean}
     */
    skip(): boolean;
    /**
     * Adds single track to the queue
     * @param {Track} track The track to add
     * @returns {void}
     */
    addTrack(track: Track): void;
    /**
     * Adds multiple tracks to the queue
     * @param {Track[]} tracks Array of tracks to add
     */
    addTracks(tracks: Track[]): void;
    /**
     * Sets paused state
     * @param {boolean} paused The paused state
     * @returns {boolean}
     */
    setPaused(paused?: boolean): boolean;
    /**
     * Sets bitrate
     * @param  {number|auto} bitrate bitrate to set
     * @returns {void}
     */
    setBitrate(bitrate: number | "auto"): void;
    /**
     * Sets volume
     * @param {number} amount The volume amount
     * @returns {boolean}
     */
    setVolume(amount: number): boolean;
    /**
     * Sets repeat mode
     * @param  {QueueRepeatMode} mode The repeat mode
     * @returns {boolean}
     */
    setRepeatMode(mode: QueueRepeatMode): boolean;
    /**
     * The current volume amount
     * @type {number}
     */
    get volume(): number;
    set volume(amount: number);
    /**
     * The stream time of this queue
     * @type {number}
     */
    get streamTime(): number;
    set streamTime(time: number);
    /**
     * Returns enabled filters
     * @returns {AudioFilters}
     */
    getFiltersEnabled(): (keyof QueueFilters)[];
    /**
     * Returns disabled filters
     * @returns {AudioFilters}
     */
    getFiltersDisabled(): (keyof QueueFilters)[];
    /**
     * Sets filters
     * @param {QueueFilters} filters Queue filters
     * @returns {Promise<void>}
     */
    setFilters(filters?: QueueFilters): Promise<void>;
    /**
     * Seeks to the given time
     * @param {number} position The position
     * @returns {boolean}
     */
    seek(position: number): Promise<boolean>;
    /**
     * Plays previous track
     * @returns {Promise<void>}
     */
    back(): Promise<void>;
    /**
     * Clear this queue
     */
    clear(): void;
    /**
     * Stops the player
     * @returns {void}
     */
    stop(): void;
    /**
     * Shuffles this queue
     * @returns {boolean}
     */
    shuffle(): boolean;
    /**
     * Removes a track from the queue
     * @param {Track|string|number} track The track to remove
     * @returns {Track}
     */
    remove(track: Track | string | number): Track;
    /**
     * Returns the index of the specified track. If found, returns the track index else returns -1.
     * @param {number|Track|string} track The track
     * @returns {number}
     */
    getTrackPosition(track: number | Track | string): number;
    /**
     * Jumps to particular track
     * @param {Track|number} track The track
     * @returns {void}
     */
    jump(track: Track | number): void;
    /**
     * Jumps to particular track, removing other tracks on the way
     * @param {Track|number} track The track
     * @returns {void}
     */
    skipTo(track: Track | number): void;
    /**
     * Inserts the given track to specified index
     * @param {Track} track The track to insert
     * @param {number} [index=0] The index where this track should be
     */
    insert(track: Track, index?: number): void;
    /**
     * @typedef {object} PlayerTimestamp
     * @property {string} current The current progress
     * @property {string} end The total time
     * @property {number} progress Progress in %
     */
    /**
     * Returns player stream timestamp
     * @returns {PlayerTimestamp}
     */
    getPlayerTimestamp(): {
        current: string;
        end: string;
        progress: number;
    };
    /**
     * Creates progress bar string
     * @param {PlayerProgressbarOptions} options The progress bar options
     * @returns {string}
     */
    createProgressBar(options?: PlayerProgressbarOptions): string;
    /**
     * Total duration
     * @type {Number}
     */
    get totalTime(): number;
    /**
     * Play stream in a voice/stage channel
     * @param {Track} [src] The track to play (if empty, uses first track from the queue)
     * @param {PlayOptions} [options] The options
     * @returns {Promise<void>}
     */
    play(src?: Track, options?: PlayOptions): Promise<void>;
    /**
     * Private method to handle autoplay
     * @param {Track} track The source track to find its similar track for autoplay
     * @returns {Promise<void>}
     * @private
     */
    private _handleAutoplay;
    [Symbol.iterator](): Generator<Track, void, undefined>;
    /**
     * JSON representation of this queue
     * @returns {object}
     */
    toJSON(): {
        id: string;
        guild: string;
        voiceChannel: string;
        options: PlayerOptions;
        tracks: import("../types/types").TrackJSON[];
    };
    /**
     * String representation of this queue
     * @returns {string}
     */
    toString(): string;
}
export { Queue };
