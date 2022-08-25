const { EmbedBuilder } = require("discord.js");

module.exports.init = function (client) {
	client.usersData
		.find({ reminds: { $gt: [] } })
		.then(users => {
			for (const user of users) {
				if (!client.users.cache.has(user.id)) client.users.fetch(user.id);
				client.databaseCache.usersReminds.set(user.id, user);
			}
		});
	setInterval(async function () {
		const dateNow = Date.now();
		client.databaseCache.usersReminds.forEach(async (user) => {
			const dUser = client.users.cache.get(user.id);
			if (dUser) {
				const reminds = user.reminds;
				const mustSent = reminds.filter((r) => r.sendAt < dateNow);
				if (mustSent.length > 0) {
					mustSent.forEach((r) => {
						const embed = new EmbedBuilder()
							.setAuthor({
								name: client.translate("general/remindme:TITLE")
							})
							.addFields([
								{
									name: client.translate("common:CREATION"),
									value: client.translate("general/remindme:CREATED", {
										time: client.convertTime(r.createdAt, "from")
									})
								},
								{
									name: client.translate("common:MESSAGE"),
									value: r.message
								}
							])
							.setColor(client.config.embed.color)
							.setFooter({
								text: client.config.embed.footer
							});
						dUser.send({
							embeds: [embed]
						});
					});
					user.reminds = user.reminds.filter((r) => r.sendAt >= dateNow);
					user.save();
					if (user.reminds.length === 0) client.databaseCache.usersReminds.delete(user.id);
				}
			}
		});
	}, 1000);
};