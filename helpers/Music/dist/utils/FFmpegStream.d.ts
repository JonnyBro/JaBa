/// <reference types="node" />
import type { Duplex, Readable } from "stream";
export interface FFmpegStreamOptions {
    fmt?: string;
    encoderArgs?: string[];
    seek?: number;
    skip?: boolean;
}
export declare function FFMPEG_ARGS_STRING(stream: string, fmt?: string): string[];
export declare function FFMPEG_ARGS_PIPED(fmt?: string): string[];
/**
 * Creates FFmpeg stream
 * @param stream The source stream
 * @param options FFmpeg stream options
 */
export declare function createFFmpegStream(stream: Readable | Duplex | string, options?: FFmpegStreamOptions): Readable | Duplex;
