const { EmbedBuilder } = require("discord.js");
const moment = require("moment");

/**
 *
 * @param {import("../base/Client")} client
 */
module.exports.init = function (client) {
	client.usersData.find({ reminds: { $gt: [] } }).then(users => {
		for (const user of users) {
			if (!client.users.cache.has(user.id)) client.users.fetch(user.id);

			client.databaseCache.usersReminds.set(user.id, user);
		}
	});

	setInterval(async function () {
		client.databaseCache.usersReminds.forEach(async user => {
			const cachedUser = client.users.cache.get(user.id);

			if (cachedUser) {
				const dateNow = Date.now(),
					reminds = user.reminds,
					mustSent = reminds.filter(r => r.sendAt < dateNow);

				if (mustSent.length > 0) {
					mustSent.forEach(r => {
						const embed = new EmbedBuilder()
							.setAuthor({
								name: client.translate("general/remindme:EMBED_TITLE"),
							})
							.addFields([
								{
									name: client.translate("general/remindme:EMBED_CREATED"),
									value: moment(r.createdAt).locale(client.defaultLanguage).format("Do MMMM YYYY, HH:mm:ss"),
									inline: true,
								},
								{
									name: client.translate("general/remindme:EMBED_TIME"),
									value: moment(r.sendAt).locale(client.defaultLanguage).format("Do MMMM YYYY, HH:mm:ss"),
									inline: true,
								},
								{
									name: client.translate("common:MESSAGE"),
									value: r.message,
								},
							])
							.setColor(client.config.embed.color)
							.setFooter(client.config.embed.footer);

						cachedUser.send({
							embeds: [embed],
						});
					});
					user.reminds = user.reminds.filter(r => r.sendAt >= dateNow);

					user.markModified("reminds");
					await user.save();

					if (user.reminds.length === 0) client.databaseCache.usersReminds.delete(user.id);
				}
			}
		});
	}, 1000);
};
