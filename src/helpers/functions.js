/**
 * Asynchronously iterates over a collection and executes a callback function for each item.
 *
 * @param {any[]} collection - The collection to iterate over.
 * @param {(item: any) => Promise<void>} callback - The async callback function to execute for each item in the collection.
 * @returns {Promise<void>} A promise that resolves when all items in the collection have been processed.
 */
export async function asyncForEach(collection, callback) {
	const allPromises = collection.map(async key => {
		await callback(key);
	});

	return await Promise.all(allPromises);
}

/**
 * Sorts an array by the specified key in ascending order.
 *
 * @param {any[]} array - The array to sort.
 * @param {string} key - The key to sort the array by.
 * @returns {any[]} The sorted array.
 */
export function sortByKey(array, key) {
	return array.sort(function (a, b) {
		const x = a[key];
		const y = b[key];
		return x < y ? 1 : x > y ? -1 : 0;
	});
}

/**
 * Shuffles the elements of the provided array in-place.
 *
 * @param {any[]} pArray - The array to shuffle.
 * @returns {any[]} The shuffled array.
 */
export function shuffle(pArray) {
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
}

/**
 * Generates a random integer between the specified minimum and maximum values (inclusive).
 *
 * @param {number} [min=0] - The minimum value (inclusive).
 * @param {number} [max=100] - The maximum value (inclusive).
 * @returns {number} A random integer between min and max.
 */
export function randomNum(min = 0, max = 100) {
	min = Math.floor(min);
	max = Math.floor(max);

	return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Formats a date for the specified client and locale.
 *
 * @param {Object} client - The client object containing language data.
 * @param {string} date - The date to format.
 * @param {string} [format=null] - The date format to use. If not provided, the default format for the client's language will be used.
 * @param {string} [locale=client.defaultLanguage.name] - The locale to use for formatting the date.
 * @returns {string} The formatted date.
 */
export function printDate(client, date, format = null, locale = client.defaultLanguage.name) {
	const { format: languageFormat, locale: localeFormat } = client.languages.find(language => language.name === locale);
	if (format === "" || format === null) format = languageFormat;
	return new Intl.DateTimeFormat(localeFormat).format(date);
}

/**
 * Generates the appropriate noun form based on the given number and noun forms.
 *
 * @param {number} number - The number to use for determining the noun form.
 * @param {string} one - The noun form for the singular case.
 * @param {string} two - The noun form for the dual case.
 * @param {string} five - The noun form for the plural case.
 * @returns {string} The appropriate noun form based on the given number.
 */
export function getNoun(number, one, two, five) {
	let n = Math.abs(number);
	n %= 100;
	if (n >= 5 && n <= 20) return five;
	n %= 10;
	if (n === 1) return one;
	if (n >= 2 && n <= 4) return two;
	return five;
}
