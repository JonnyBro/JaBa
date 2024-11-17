// Thanks Stackoverflow <3
function setDaysTimeout(callback, days) {
	// 86400 seconds in a day
	const msInDay = 86400 * 1000;

	let dayCount = 0;
	const timer = setInterval(function () {
		dayCount++; // a day has passed

		if (dayCount === days) {
			clearInterval(timer);
			callback.apply(this, []);
		}
	}, msInDay);
}

/**
 *
 * @param {import("../base/Client")} client
 */
module.exports.init = async function (client) {
	setDaysTimeout(async () => {
		const timestamp = Date.now() + 29 * 24 * 60 * 60 * 1000; // 29 days
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
	}, 14);

	setDaysTimeout(async () => {
		client.usersData.find({}, function (err, res) {
			for (const user of res) {
				client.users.fetch(user.id).then(async u => {
					if (u.username.match(/.*Deleted User.* [A-z0-9]+/g)) {
						await client.databaseCache.users.delete(u.id);
						await client.usersData.deleteOne({ id: u.id });
						client.logger.log(`Removed from database deleted user - ID: ${u.id} Username: ${u.username}`);

						await client.usersData.save();
					}
				});
			}
		});

		client.membersData.find({}, function (err, res) {
			for (const user of res) {
				client.users.fetch(user.id).then(async u => {
					if (u.username.match(/.*Deleted User.* [A-z0-9]+/g)) {
						await client.databaseCache.members.delete(u.id);
						await client.membersData.deleteOne({ id: u.id });
						client.logger.log(`Removed from database deleted user - ID: ${u.id} Username: ${u.username}`);

						await client.membersData.save();
					}
				});
			}
		});
	}, 30);
};
