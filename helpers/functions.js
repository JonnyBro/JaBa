const { PermissionsBitField, ChannelType } = require("discord.js");

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
	 * Sort array by key
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
	 * Shuffles array
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
};