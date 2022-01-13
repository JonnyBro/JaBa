const express = require("express"),
	utils = require("../utils"),
	CheckAuth = require("../auth/CheckAuth"),
	router = express.Router();

router.get("/:serverID", CheckAuth, async (req, res) => {
	// Check if the user has the permissions to edit this guild
	const guild = req.client.guilds.cache.get(req.params.serverID);
	if (!guild) {
		return res.render("404", {
			user: req.userInfos,
			translate: req.translate,
			currentURL: `${req.client.config.dashboard.baseURL}${req.originalUrl}`
		});
	}

	const memberData = await req.client.findOrCreateMember({ id: req.userInfos.id, guildID: guild.id });

	// Fetch guild informations
	const membersData = await req.client.membersData.find({
			guildID: guild.id
		}).lean(),
		members = membersData.map((m) => {
			return {
				id: m.id,
				money: m.money + m.bankSold
			};
		}).sort((a, b) => b.money - a.money);

	const leaderboards = {
		money: members,
		level: utils.sortArrayOfObjects("level", membersData)
	};

	for (const cat in leaderboards) {
		const e = leaderboards[cat];
		if (e.length > 10) e.length = 10;
	}

	const stats = {
		money: await utils.fetchUsers(leaderboards.money, req.client),
		level: await utils.fetchUsers(leaderboards.level, req.client)
	};

	res.render("stats/guild", {
		user: req.userInfos,
		stats,
		memberData: memberData,
		bot: req.client,
		convertTime: req.convertTime,
		guildID: guild.id,
		translate: req.translate,
		currentURL: `${req.client.config.dashboard.baseURL}${req.originalUrl}`,
	});
});

module.exports = router;