import UserModel from "../models/UserModel";
import useClient from "../utils/use-client";

const checkReminds = async () => {
	const client = useClient();

	client.adapter.find(UserModel, { reminds: { $gt: [] } }).then(users => {
		for (const user of users) {
			if (!client.users.cache.has(user.id)) client.users.fetch(user.id);

			client.cacheReminds.set(user.id, user);
		}
	});

	client.cacheReminds.forEach(async user => {
		const cachedUser = client.users.cache.get(user.id);

		if (!cachedUser) return;

		const reminds = user.reminds,
			mustSent = reminds.filter(r => r.sendAt < Math.floor(Date.now() / 1000));

		if (!mustSent.length) return;

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

			cachedUser.send({ embeds: [embed] }).then(() => {
				client.adapter.updateOne(UserModel, { id: user.id }, { $pull: { reminds: { _id: r._id } } });
			});
		});

		if (!user.reminds.length) client.cacheReminds.delete(user.id);
	});
};

export const init = async () => {
	setInterval(async () => {
		await checkReminds();
	}, 1000);
};