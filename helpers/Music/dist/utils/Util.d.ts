import { StageChannel, VoiceChannel } from "discord.js";
import { TimeData } from "../types/types";
declare class Util {
    /**
     * Utils
     */
    private constructor();
    /**
     * Creates duration string
     * @param {object} durObj The duration object
     * @returns {string}
     */
    static durationString(durObj: Record<string, number>): string;
    /**
     * Parses milliseconds to consumable time object
     * @param {number} milliseconds The time in ms
     * @returns {TimeData}
     */
    static parseMS(milliseconds: number): TimeData;
    /**
     * Builds time code
     * @param {TimeData} duration The duration object
     * @returns {string}
     */
    static buildTimeCode(duration: TimeData): string;
    /**
     * Picks last item of the given array
     * @param {any[]} arr The array
     * @returns {any}
     */
    static last<T = any>(arr: T[]): T;
    /**
     * Checks if the voice channel is empty
     * @param {VoiceChannel|StageChannel} channel The voice channel
     * @returns {boolean}
     */
    static isVoiceEmpty(channel: VoiceChannel | StageChannel): boolean;
    /**
     * Safer require
     * @param {string} id Node require id
     * @returns {any}
     */
    static require(id: string): any;
    /**
     * Asynchronous timeout
     * @param {number} time The time in ms to wait
     * @returns {Promise<unknown>}
     */
    static wait(time: number): Promise<unknown>;
    static noop(): void;
    static getFetch(): Promise<any>;
}
export { Util };
