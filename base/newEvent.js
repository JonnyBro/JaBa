export default class BaseEvent {
	/**
	 * @param {{ name: import("discord.js").ClientEvents, once: boolean}} options
	 * @param {Function} run
	 */
	constructor(data, run) {
		this.data = data;
		this.run = run;
	}
}
