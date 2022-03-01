const { Permissions } = require("discord.js");
const languages = require("../languages/language-meta.json").map((l) => l.moment).filter((l) => l !== "en");
languages.forEach((lang) => {
	require(`moment/locale/${lang}.js`);
});

module.exports = {
	getPrefix(message, data) {
		if (message.channel.type !== "DM") {
			const prefixes = [
				`<@!${message.client.user.id}> `,
				`<@${message.client.user.id}> `,
				`<@!${message.client.user.id}>`,
				`<@${message.client.user.id}>`,
				message.client.user.username.toLowerCase(),
				data.guild.prefix
			];

			let prefix = null;

			prefixes.forEach((p) => {
				if (message.content.startsWith(p) || message.content.toLowerCase().startsWith(p)) prefix = p;
			});

			return prefix;
		} else return true;
	},

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
		} return "No Invite";
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
	},

	convertTime(guild, time) {
		const absoluteSeconds = Math.floor((time / 1000) % 60);
		const absoluteMinutes = Math.floor((time / (1000 * 60)) % 60);
		const absoluteHours = Math.floor((time / (1000 * 60 * 60)) % 24);
		const absoluteDays = Math.floor(time / (1000 * 60 * 60 * 24));

		const d = absoluteDays ?
			absoluteDays === 1 ?
				guild.translate("time:ONE_DAY") :
				guild.translate("time:DAYS", {
					amount: absoluteDays
				}) :
			null;
		const h = absoluteHours ?
			absoluteHours === 1 ?
				guild.translate("time:ONE_HOUR") :
				guild.translate("time:HOURS", {
					amount: absoluteHours
				}) :
			null;
		const m = absoluteMinutes ?
			absoluteMinutes === 1 ?
				guild.translate("time:ONE_MINUTE") :
				guild.translate("time:MINUTES", {
					amount: absoluteMinutes
				}) :
			null;
		const s = absoluteSeconds ?
			absoluteSeconds === 1 ?
				guild.translate("time:ONE_SECOND") :
				guild.translate("time:SECONDS", {
					amount: absoluteSeconds
				}) :
			null;

		const absoluteTime = [];
		if (d) absoluteTime.push(d);
		if (h) absoluteTime.push(h);
		if (m) absoluteTime.push(m);
		if (s) absoluteTime.push(s);

		return absoluteTime.join(", ");
	}
};