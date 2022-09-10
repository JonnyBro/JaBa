/// <reference types="node" />
/// <reference types="node" />
import { Transform, TransformOptions } from "stream";
export interface VolumeTransformerOptions extends TransformOptions {
    type?: "s16le" | "s16be" | "s32le" | "s32be";
    smoothness?: number;
    volume?: number;
}
export declare class VolumeTransformer extends Transform {
    private _bits;
    private _smoothing;
    private _bytes;
    private _extremum;
    private _chunk;
    volume: number;
    private _targetVolume;
    type: "s16le" | "s32le" | "s16be" | "s32be";
    constructor(options?: VolumeTransformerOptions);
    _readInt(buffer: Buffer, index: number): number;
    _writeInt(buffer: Buffer, int: number, index: number): number;
    _applySmoothness(): void;
    _transform(chunk: Buffer, encoding: BufferEncoding, done: () => unknown): unknown;
    _destroy(err: Error, cb: (error: Error) => void): void;
    setVolume(volume: number): void;
    setVolumeDecibels(db: number): void;
    setVolumeLogarithmic(value: number): void;
    get volumeDecibels(): number;
    get volumeLogarithmic(): number;
    get smoothness(): number;
    setSmoothness(smoothness: number): void;
    smoothingEnabled(): boolean;
    get hasSmoothness(): boolean;
    static get hasSmoothing(): boolean;
}
