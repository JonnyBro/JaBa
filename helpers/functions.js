const moment = require("moment");

moment.relativeTimeThreshold("ss", 5);
moment.relativeTimeThreshold("s", 60);
moment.relativeTimeThreshold("m", 60);
moment.relativeTimeThreshold("h", 60);
moment.relativeTimeThreshold("d", 24);
moment.relativeTimeThreshold("M", 12);

module.exports = {
	/**
	 * Calls a Callback for Each Element in Collection Asynchronously
	 * @param {Array} collection Collection
	 * @param {Function} callback Function to Perform on Collection
	 * @returns {Promise}
	 */
	async asyncForEach(collection, callback) {
		const allPromises = collection.map(async key => {
			await callback(key);
		});

		return await Promise.all(allPromises);
	},

	/**
	 * Sorts an Array by Key
	 * @param {Array} array Array to Sort
	 * @param {Number} key Key
	 * @returns {Array} Sorted Array
	 */
	sortByKey(array, key) {
		return array.sort(function (a, b) {
			const x = a[key];
			const y = b[key];
			return x < y ? 1 : x > y ? -1 : 0;
		});
	},

	/**
	 * Shuffles the Array
	 * @param {Array} pArray Array to Shuffle
	 * @returns {Array} Shuffled Array
	 */
	shuffle(pArray) {
		const array = [];

		pArray.forEach(element => array.push(element));

		let currentIndex = array.length,
			temporaryValue,
			randomIndex;

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
	 * Returns a Random Number Between min (inclusive) And max (inclusive)
	 * @param {Number} min Min value (inclusive)
	 * @param {Number} max Max value (inclusive)
	 * @returns {Number} Integer
	 */
	randomNum(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);

		return Math.floor(Math.random() * (max - min + 1) + min);
	},

	/**
	 * Beautifies the given Date
	 * @param {import("../base/Client")} client Discord Client
	 * @param {Date} date Date
	 * @param {String | null} format Format for Moment
	 * @param {String} locale Language
	 * @returns {String} Beautified Date
	 */
	printDate(client, date, format = null, locale = client.defaultLanguage.name) {
		const languageData = client.languages.find(language => language.name === locale);
		if (format === "" || format === null) format = languageData.defaultMomentFormat;

		return moment(new Date(date)).locale(languageData.moment).format(format);
	},

	/**
	 * Converts the Given Time
	 * @param {import("../base/Client")} client Discord Client
	 * @param {String} time Time
	 * @param {Boolean} type Type (To now = true or from now = false)
	 * @param {Boolean} prefix Include Prefix
	 * @param {String} locale Language
	 * @returns {String} Time
	 */
	convertTime(client, time, type = false, prefix = true, locale = client.defaultLanguage.name) {
		const languageData = client.languages.find(language => language.name === locale);
		const m = moment(time).locale(languageData.moment);

		return type ? m.toNow(!prefix) : m.fromNow(!prefix);
	},

	/**
	 * Get a Noun for Number
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
