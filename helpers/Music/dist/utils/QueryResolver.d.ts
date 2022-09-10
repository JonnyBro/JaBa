import { QueryType } from "../types/types";
declare class QueryResolver {
    /**
     * Query resolver
     */
    private constructor();
    /**
     * Resolves the given search query
     * @param {string} query The query
     * @returns {QueryType}
     */
    static resolve(query: string): Promise<QueryType>;
    /**
     * Parses vimeo id from url
     * @param {string} query The query
     * @returns {string}
     */
    static getVimeoID(query: string): Promise<string>;
}
export { QueryResolver };
