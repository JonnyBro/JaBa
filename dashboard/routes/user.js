const express = require("express"),
	utils = require("../utils"),
	CheckAuth = require("../auth/CheckAuth"),
	router = express.Router();

// Gets user page
router.get("/:userID/:serverID", CheckAuth, async function (req, res) {
	const guild = req.client.guilds.cache.get(req.params.serverID);
	if (!guild)
		return res.render("404", {
			user: req.userInfos,
			translate: req.translate,
			currentURL: `${req.client.config.dashboard.baseURL}${req.originalUrl}`,
		});

	const guildData = await req.client.findOrCreateGuild({ id: guild.id });

	const userInfos = await utils.fetchUser({
		id: req.params.userID,
	}, req.client).catch(() => {
		res.render("404", {
			user: req.userInfos,
			translate: req.translate,
			currentURL: `${req.client.config.dashboard.baseURL}${req.originalUrl}`,
		});
	});

	res.render("user", {
		user: req.userInfos,
		userInfos: userInfos,
		guild: guildData,
		bot: req.client,
		translate: req.translate,
		printDate: req.printDate,
		currentURL: `${req.client.config.dashboard.baseURL}${req.originalUrl}`,
	});
});

module.exports = router;