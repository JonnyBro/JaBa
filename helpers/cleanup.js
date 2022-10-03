/**
 *
 * @param {import("../base/JaBa")} client
 */
module.exports.init = async function (client) {
	setInterval(async () => {
		const timestamp = Date.now() + (30 * 24 * 60 * 60 * 1000); // 1 month
		const members = client.membersData.find({ transactions: { $gt: [] } });

		for (const member of members) {
			const transactions = member.transactions;
			for await (const transaction of transactions) {
				if (transaction.date < timestamp) {
					const index = transactions.indexOf(transaction);
					transactions.splice(index, 1);
					await member.save();
				}
			}
		}
	}, (7 * 24 * 60 * 60 * 1000)); // every 7 days

	/*
	setInterval(async () => {
		client.usersData.find({}, function (err, res) {
			for (const user of res) {
				client.users.fetch(user.id).then(u => {
					if (u.username.match(/.*Deleted User.* [A-z0-9]+/g)) {
						client.databaseCache.users.delete(u.id);
						client.usersData.deleteOne({ id: u.id });
						client.logger.log(`Removed from database deleted user - ID: ${u.id} Username: ${u.username}`);
					}
				});
			}
		});
	}, (7 * 24 * 60 * 60 * 1000)); // every 7 days
	*/
};