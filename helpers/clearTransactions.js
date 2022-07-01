module.exports = {
	async init(client) {
		setInterval(async () => {
			const timestamp = Date.now() + 30 * 24 * 60 * 60 * 1000; // day hour min sec msec / 1 month
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
		}, 24 * 60 * 60 * 1000); // every 24 hours
	},
};