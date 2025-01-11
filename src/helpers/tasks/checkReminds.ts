import { createEmbed } from "@/utils/create-embed.js";
import UserModel from "../../models/UserModel.js";
import useClient from "../../utils/use-client.js";
import { CronTaskData } from "@/types.js";

export const data: CronTaskData = {
	name: "checkReminds",
	task: async () => {
		const client = useClient();

		client.adapter.find(UserModel, { reminds: { $gt: [] } }).then(users => {
			for (const user of users) {
				if (!client.users.cache.has(user.id)) client.users.fetch(user.id);

				client.cacheReminds.set(user.id, {
					id: user.id,
					reminds: user.reminds,
				});
			}
		});

		client.cacheReminds.forEach(async ({ id, reminds }) => {
			const cachedUser = client.users.cache.get(id);

			if (!cachedUser) return;

			const mustSent = reminds.filter(r => r.sendAt < Math.floor(Date.now() / 1000));

			if (!mustSent.length) return;

			mustSent.forEach(r => {
				const embed = createEmbed({
					author: {
						name: client.translate("general/remindme:EMBED_TITLE"),
					},
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

				cachedUser
					.send({
						embeds: [embed],
					})
					.then(() => {
						client.adapter.updateOne(
							UserModel,
							{ id },
							{
								$pull: {
									reminds: {
										sendAt: r.sendAt,
									},
								},
							},
						);
					});
			});

			reminds = reminds.filter(r => r.sendAt >= Math.floor(Date.now() / 1000));

			if (!reminds.length) client.cacheReminds.delete(id);
		});
	},
	schedule: "* * * * * *",
};
