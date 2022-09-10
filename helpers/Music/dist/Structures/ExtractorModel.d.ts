import { ExtractorModelData } from "../types/types";
declare class ExtractorModel {
    name: string;
    private _raw;
    /**
     * Model for raw Discord Player extractors
     * @param {string} extractorName Name of the extractor
     * @param {object} data Extractor object
     */
    constructor(extractorName: string, data: any);
    /**
     * Method to handle requests from `Player.play()`
     * @param {string} query Query to handle
     * @returns {Promise<ExtractorModelData>}
     */
    handle(query: string): Promise<ExtractorModelData>;
    /**
     * Method used by Discord Player to validate query with this extractor
     * @param {string} query The query to validate
     * @returns {boolean}
     */
    validate(query: string): boolean;
    /**
     * The extractor version
     * @type {string}
     */
    get version(): string;
}
export { ExtractorModel };
