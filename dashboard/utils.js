const { PermissionsBitField } = require("discord.js");

/**
 * Fetch user informations (stats, guilds, etc...)
 * @param {object} userData The oauth2 user informations
 * @param {object} client The discord client instance
 * @param {string} query The optional query for guilds
 * @returns {object} The user informations
 */
async function fetchUser(userData, client, query) {
	if (userData.guilds) {
		userData.guilds.forEach(guild => {
			if (!client.guilds.cache.get(guild.id)) return;
			const perms = new PermissionsBitField(BigInt(guild.permissions));
			if (perms.has(PermissionsBitField.Flags.ManageGuild)) guild.admin = true;

			guild.settingsUrl = (client.guilds.cache.get(guild.id) ? `/manage/${guild.id}/` : `https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=8&guild_id=${guild.id}`);
			guild.statsUrl = (client.guilds.cache.get(guild.id) ? `/stats/${guild.id}/` : `https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=8&guild_id=${guild.id}`);
			guild.iconURL = (guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128` : "https://discordemoji.com/assets/emoji/discordcry.png");
			guild.displayed = (query ? guild.name.toLowerCase().includes(query.toLowerCase()) : true);
		});
		userData.displayedGuilds = userData.guilds.filter(g => g.displayed && g.admin);
		if (userData.displayedGuilds.length < 1) delete userData.displayedGuilds;
	}

	const user = await client.users.fetch(userData.id);
	const userDb = await client.findOrCreateUser({
		id: user.id,
	}, true);

	const userInfos = {
		...user.toJSON(),
		...userDb,
		...userData,
	};

	return userInfos;
}

/**
 * Fetch users informations
 * @param {object} array The array of users
 * @param {object} client The discord client instance
 * @returns {object} The user informations
 */
async function fetchUsers(array, client) {
	return new Promise(resolve => {
		const users = [];
		array.filter(e => e.id).forEach(element => {
			client.users.fetch(element.id).then(user => {
				if (user.username.length > 15) user.username = user.username.substr(0, 12) + "...";

				users.push({
					...{
						money: element.money,
						level: element.level,
						rep: element.rep,
					},
					...user.toJSON(),
				});
			});
		});
		resolve(users);
	});
}

/**
 * Fetch guild informations
 * @param {string} guildID The ID of the guild to fetch
 * @param {object} client The discord client instance
 * @param {array} guilds The user guilds
 * @returns {object} The guild informations
 */
async function fetchGuild(guildID, client, guilds) {
	const guild = client.guilds.cache.get(guildID);
	const conf = await client.findOrCreateGuild({
		id: guild.id,
	});

	return {
		...guild,
		...conf.toJSON(),
		...guilds.find(g => g.id === guild.id),
	};
}

function sortArrayOfObjects(key, arr) {
	const array = arr.slice(0);
	return array.sort((a, b) => {
		return b[key] - a[key];
	});
}

module.exports = { fetchUser, fetchUsers, fetchGuild, sortArrayOfObjects };