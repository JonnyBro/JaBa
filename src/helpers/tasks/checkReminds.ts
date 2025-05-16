import { createEmbed } from "@/utils/create-embed.js";
import UserModel from "../../models/UserModel.js";
import useClient from "../../utils/use-client.js";
import { CronTaskData } from "@/types.js";

export const data: CronTaskData = {
	name: "checkReminds",
	task: async () => {
		const client = useClient();

		const users = await client.adapter.find(UserModel, { reminds: { $gt: [] } });

		for (const user of users) {
			if (!client.users.cache.has(user.id)) {
				client.users.fetch(user.id);
			}

			client.cacheReminds.set(user.id, {
				id: user.id,
				reminds: user.reminds,
			});
		}

		client.cacheReminds.forEach(async ({ id, reminds }) => {
			const cachedUser = client.users.cache.get(id);

			if (!cachedUser) return;

			const mustSent = reminds.filter(r => r.sendAt < Math.floor(Date.now() / 1000));

			if (!mustSent.length) return;

			mustSent.forEach(async r => {
				const embed = createEmbed({
					author: {
						name: client.i18n.translate("general/remindme:EMBED_TITLE"),
					},
					fields: [
						{
							name: client.i18n.translate("general/remindme:EMBED_CREATED"),
							value: `<t:${r.createdAt}:f>`,
							inline: true,
						},
						{
							name: client.i18n.translate("general/remindme:EMBED_TIME"),
							value: `<t:${r.sendAt}:f>`,
							inline: true,
						},
						{
							name: client.i18n.translate("common:MESSAGE"),
							value: r.message,
						},
					],
				});

				await cachedUser.send({
					embeds: [embed],
				});

				await client.adapter.updateOne(
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

			const updatedReminds = reminds.filter(r => r.sendAt >= Math.floor(Date.now() / 1000));

			if (!updatedReminds.length) {
				client.cacheReminds.delete(id);
			} else {
				client.cacheReminds.set(id, { id, reminds: updatedReminds });
			}
		});
	},
	schedule: "* * * * *",
};
