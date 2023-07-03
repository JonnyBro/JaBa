const { PermissionsBitField, ChannelType } = require("discord.js");
const moment = require("moment");

moment.relativeTimeThreshold("ss", 5);
moment.relativeTimeThreshold("s", 60);
moment.relativeTimeThreshold("m", 60);
moment.relativeTimeThreshold("h", 60);
moment.relativeTimeThreshold("d", 24);
moment.relativeTimeThreshold("M", 12);

module.exports = {
	/**
	 * Create invite link to guild
	 * @param {import("../base/JaBa")} client Discord client
	 * @param {String} guildId Guild's ID
	 * @returns {String} Invite Link
	 */
	async createInvite(client, guildId) {
		const guild = client.guilds.cache.get(guildId);
		const member = guild.members.me;
		const channel = guild.channels.cache.find(ch => ch.permissionsFor(member.id).has(PermissionsBitField.Flags.CreateInstantInvite) && ch.type === ChannelType.GuildText || ch.type === "GUILD_VOICE");
		if (channel) return (await channel.createInvite()).url || "No channels found or missing permissions";
	},

	/**
	 * Calls a callback for each element in collection async
	 * @param {Array} collection
	 * @param {Function} callback
	 * @returns {Promise}
	 */
	async asyncForEach(collection, callback) {
		const allPromises = collection.map(async key => {
			await callback(key);
		});

		return await Promise.all(allPromises);
	},

	/**
	 * Sorts array by key
	 * @param {Array} array Array to sort
	 * @param {Number} key Key
	 * @returns {Array} Sorted array
	 */
	sortByKey(array, key) {
		return array.sort(function (a, b) {
			const x = a[key];
			const y = b[key];
			return ((x < y) ? 1 : ((x > y) ? -1 : 0));
		});
	},

	/**
	 * Shuffles the array
	 * @param {*} pArray Array to shuffle
	 * @returns {Array} Shuffled array
	 */
	shuffle(pArray) {
		const array = [];
		pArray.forEach(element => array.push(element));
		let currentIndex = array.length,
			temporaryValue, randomIndex;

		while (currentIndex !== 0) {
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	},

	/**
	 * Returns a random integer between min (inclusive) and max (inclusive)
	 * @param {Number} min Min
	 * @param {Number} max Max
	 * @returns {Number} Integer
	 */
	randomNum(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);

		return Math.floor(Math.random() * (max - min + 1) + min);
	},

	/**
	 * Beautify date
	 * @param {import("../base/JaBa")} client Discord client
	 * @param {Date} date Date
	 * @param {String | null} format Format for moment
	 * @param {String} locale Language
	 * @returns {String} Beautified date
	 */
	printDate(client, date, format = "", locale = client.defaultLanguage) {
		const languageData = client.languages.find(language => language.name === locale);
		if (format === "" || format === null) format = languageData.defaultMomentFormat;

		return moment(new Date(date))
			.locale(languageData.moment)
			.format(format);
	},

	/**
	 * Converts given time
	 * @param {import("../base/JaBa")} client Discord client
	 * @param {String} time Time
	 * @param {Boolean} type Type (To now = true or from now = false)
	 * @param {Boolean} noPrefix Use prefix?
	 * @param {String} locale Language
	 * @returns {String} Time
	 */
	convertTime(client, time, type = false, noPrefix = false, locale = this.defaultLanguage) {
		const languageData = client.languages.find(language => language.name === locale);
		const m = moment(time).locale(languageData.moment);

		return (type ? m.toNow(noPrefix) : m.fromNow(noPrefix));
	},

	/**
	 * Get a noun for number
	 * @param {Number} number Number
	 * @param {String} one String for one
	 * @param {String} two String for two
	 * @param {String} five String for five
	 * @returns
	 */
	getNoun(number, one, two, five) {
		let n = Math.abs(number);
		n %= 100;
		if (n >= 5 && n <= 20) return five;
		n %= 10;

		if (n === 1) return one;
		if (n >= 2 && n <= 4) return two;

		return five;
	},
};