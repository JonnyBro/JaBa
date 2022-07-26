const { Permissions } = require("discord.js"),
	langs = require("../languages/language-meta.json").map((l) => l.moment).filter((l) => l !== "en");
langs.forEach((lang) => {
	require(`moment/locale/${lang}.js`);
});

module.exports = {
	async createInvite(client, guildId) {
		const guild = client.guilds.cache.get(guildId);
		const member = guild.me;
		const channel = guild.channels.cache.find((ch) => ch.permissionsFor(member.id).has(Permissions.FLAGS.CREATE_INSTANT_INVITE) && ch.type === "GUILD_TEXT" || ch.type === "GUILD_VOICE");
		if (channel) {
			const invite = await channel.createInvite({
				maxAge: 0,
				maxUses: 5
			}).catch(() => {});

			return invite ? invite.url : "No URL";
		} return "No channels found for invite";
	},

	sortByKey(array, key) {
		return array.sort(function (a, b) {
			const x = a[key];
			const y = b[key];
			return ((x < y) ? 1 : ((x > y) ? -1 : 0));
		});
	},

	shuffle(pArray) {
		const array = [];
		pArray.forEach(element => array.push(element));
		let currentIndex = array.length,
			temporaryValue, randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;
			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	},

	randomNum(min, max) {
		return Math.floor(Math.random() * (max - min) + min + 1);
	}
};