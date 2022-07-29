/**
 *
 * @param {import("discord.js").Guild} guild
 * @param {String} search
 * @param {String} channelType
 * @returns
 */
const resolveChannel = async ({ guild, search, channelType }) => {
	if (!search || typeof search !== "string") return;

	// Try by parsing the search
	if (search.match(/^<#([0-9]{18})>/)) {
		const [, channelId] = search.match(/^<#([0-9]{18})>/);
		const channelFound = guild.channels.cache.get(channelId);
		if (channelFound && channelType && channelFound.type === channelType) return channelFound;
	}

	// Try with ID
	if (guild.channels.cache.has(search)) {
		const channelFound = guild.channels.cache.get(search);
		if (channelFound && channelType && channelFound.type === channelType) return channelFound;
	}

	// Try with name with #
	if (guild.channels.cache.some(channel => `#${channel.name}` === search || channel.name === search)) {
		const channelFound = guild.channels.cache.find(channel => `#${channel.name}` === search || channel.name === search);
		if (channelFound && channelType && channelFound.type === channelType) return channelFound;
	}

	return;
};

/**
 *
 * @param {import("discord.js").Guild} guild
 * @param {String} search
 * @returns
 */
const resolveMember = async ({ guild, search }) => {
	if (!search || typeof search !== "string") return;

	// Try by parsing the search
	if (search.match(/^<@!?(\d+)>$/)) {
		const [, userId] = search.match(/^<@!?(\d+)>$/);
		const memberFound = await guild.members.fetch(userId).catch(() => {});
		if (memberFound) return memberFound;
	}

	// Try with ID
	if (await guild.members.fetch(search).catch(() => {})) {
		const memberFound = await guild.members.fetch(search);
		if (memberFound) return memberFound;
	}

	// Try with name with @
	await guild.members.fetch({
		query: search
	});

	if (guild.members.cache.some(member => member.user.tag === search || member.user.username === search)) {
		const memberFound = guild.members.cache.find(member => member.user.tag === search || member.user.username === search);
		if (memberFound) return memberFound;
	}

	return;
};

/**
 *
 * @param {import("discord.js").Guild} guild
 * @param {String} search
 * @returns
 */
const resolveRole = async ({ guild, search }) => {
	if (!search || typeof search !== "string") return;

	// Try by parsing the search
	if (search.match(/^<@&([0-9]{18})>/)) {
		const [, roleId] = search.match(/^<@&([0-9]{18})>/);
		const roleFound = guild.roles.cache.get(roleId);
		if (roleFound)
			return roleFound;
	}

	// Try with ID
	if (guild.roles.cache.has(search)) {
		const roleFound = guild.roles.cache.get(search);
		if (roleFound) return roleFound;
	}

	// Try with name with @
	if (guild.roles.cache.some(role => `@${role.name}` === search || role.name === search)) {
		const roleFound = guild.roles.cache.find(role => `@${role.name}` === search || role.name === search);
		if (roleFound) return roleFound;
	}

	return;
};

module.exports = { resolveChannel, resolveMember, resolveRole };