import { FiltersName } from "../types/types";
declare class AudioFilters {
    constructor();
    static get filters(): Record<FiltersName, string>;
    static get<K extends FiltersName>(name: K): Record<keyof import("../types/types").QueueFilters, string>[K];
    static has<K extends FiltersName>(name: K): boolean;
    static [Symbol.iterator](): IterableIterator<{
        name: FiltersName;
        value: string;
    }>;
    static get names(): (keyof import("../types/types").QueueFilters)[];
    static get length(): number;
    static toString(): string;
    /**
     * Create ffmpeg args from the specified filters name
     * @param filter The filter name
     * @returns
     */
    static create<K extends FiltersName>(filters?: K[]): string;
    /**
     * Defines audio filter
     * @param filterName The name of the filter
     * @param value The ffmpeg args
     */
    static define(filterName: string, value: string): void;
    /**
     * Defines multiple audio filters
     * @param filtersArray Array of filters containing the filter name and ffmpeg args
     */
    static defineBulk(filtersArray: {
        name: string;
        value: string;
    }[]): void;
}
export default AudioFilters;
export { AudioFilters };
