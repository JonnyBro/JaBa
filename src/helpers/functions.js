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
	return (Math.random() * (max - min + 1)) << 0;
}

/**
 * Formats a date for the specified client and locale.
 *
 * @param {string} date - The date to format.
 * @param {Intl.LocalesArgument} [locale] - The locale to use for formatting the date.
 * @returns {string} The formatted date.
 */
export function printDate(date, locale = "en-US") {
	return new Intl.DateTimeFormat(locale).format(date);
}

/**
 * Generates the appropriate noun form based on the given number and noun forms.
 *
 * @param {number} number - The number to use for determining the noun form.
 * @param {Array} wordForms - An array of three elements: [one, two, five].
 * @returns {string} The appropriate noun form based on the given number.
 */
export function getNoun(number, wordForms) {
	if (!Array.isArray(wordForms) || wordForms.length !== 3) {
		throw new Error("wordForms should be an array with three elements: [one, two, five]");
	}

	const [one, two, five] = wordForms;
	let n = Math.abs(number);
	n %= 100;
	if (n >= 5 && n <= 20) return five;
	n %= 10;
	if (n === 1) return one;
	if (n >= 2 && n <= 4) return two;
	return five;
}
