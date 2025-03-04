export async function asyncForEach<T>(collection: T[], callback: (_item: T) => Promise<void>) {
	const allPromises = collection.map(async key => {
		await callback(key);
	});

	return await Promise.all(allPromises);
}

export function shuffle<T>(pArray: T[]) {
	const array: T[] = [];

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

export function randomNum(min: number = 0, max: number = 100) {
	return (Math.random() * (max - min + 1)) << 0;
}

export function printDate(date: Date | number, locale: Intl.LocalesArgument = "en-US") {
	return new Intl.DateTimeFormat(locale).format(date);
}

export function getNoun(number: number, wordForms: string[]) {
	if (!Array.isArray(wordForms) || wordForms.length !== 3) throw new Error("wordForms should be an array with three elements: [one, two, five]");

	const [one, two, five] = wordForms;
	let n = Math.abs(number);
	n %= 100;
	if (n >= 5 && n <= 20) return five;
	n %= 10;
	if (n === 1) return one;
	if (n >= 2 && n <= 4) return two;
	return five;
}
