import { Player } from "../Player";
import { Track } from "./Track";
import { PlaylistInitData, PlaylistJSON, TrackSource } from "../types/types";
declare class Playlist {
    readonly player: Player;
    tracks: Track[];
    title: string;
    description: string;
    thumbnail: string;
    type: "album" | "playlist";
    source: TrackSource;
    author: {
        name: string;
        url: string;
    };
    id: string;
    url: string;
    readonly rawPlaylist?: any;
    /**
     * Playlist constructor
     * @param {Player} player The player
     * @param {PlaylistInitData} data The data
     */
    constructor(player: Player, data: PlaylistInitData);
    [Symbol.iterator](): Generator<Track, void, undefined>;
    /**
     * JSON representation of this playlist
     * @param {boolean} [withTracks=true] If it should build json with tracks
     * @returns {PlaylistJSON}
     */
    toJSON(withTracks?: boolean): PlaylistJSON;
}
export { Playlist };
