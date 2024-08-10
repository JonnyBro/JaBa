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
				const dateNow = Math.floor(Date.now() / 1000),
					reminds = user.reminds,
					mustSent = reminds.filter(r => r.sendAt < dateNow);

				if (mustSent.length > 0) {
					mustSent.forEach(r => {
						const embed = client.embed({
							author: client.translate("general/remindme:EMBED_TITLE"),
							fields: [
								{
									name: client.translate("general/remindme:EMBED_CREATED"),
									value: `<t:${r.createdAt}:f>`,
									inline: true,
								},
								{
									name: client.translate("general/remindme:EMBED_TIME"),
									value: `<t:${r.sendAt}:f>`,
									inline: true,
								},
								{
									name: client.translate("common:MESSAGE"),
									value: r.message,
								},
							],
						});

						cachedUser.send({
							embeds: [embed],
						});
					});

					user.reminds = user.reminds.filter(r => r.sendAt >= dateNow);

					await user.save();

					if (user.reminds.length === 0) client.databaseCache.usersReminds.delete(user.id);
				}
			}
		});
	}, 1000);
};

/**
 *
 * @param {import("../base/Client")} client
 */
module.exports.run = function (client) {
	client.usersData.find({ reminds: { $gt: [] } }).then(users => {
		for (const user of users) {
			if (!client.users.cache.has(user.id)) client.users.fetch(user.id);

			client.databaseCache.usersReminds.set(user.id, user);
		}
	});

	client.databaseCache.usersReminds.forEach(async user => {
		const cachedUser = client.users.cache.get(user.id);

		if (cachedUser) {
			const dateNow = Math.floor(Date.now() / 1000),
				reminds = user.reminds,
				mustSent = reminds.filter(r => r.sendAt < dateNow);

			if (mustSent.length > 0) {
				mustSent.forEach(r => {
					const embed = client.embed({
						author: client.translate("general/remindme:EMBED_TITLE"),
						fields: [
							{
								name: client.translate("general/remindme:EMBED_CREATED"),
								value: `<t:${r.createdAt}:f>`,
								inline: true,
							},
							{
								name: client.translate("general/remindme:EMBED_TIME"),
								value: `<t:${r.sendAt}:f>`,
								inline: true,
							},
							{
								name: client.translate("common:MESSAGE"),
								value: r.message,
							},
						],
					});

					cachedUser.send({
						embeds: [embed],
					});
				});

				user.reminds = user.reminds.filter(r => r.sendAt >= dateNow);

				await user.save();

				if (user.reminds.length === 0) client.databaseCache.usersReminds.delete(user.id);
			}
		}
	});
};
