const express = require("express"),
	router = express.Router(),
	fs = require("fs");

router.get("/", function (req, res) {
	res.render("docs", {
		user: req.userInfos,
		translate: req.translate,
		currentURL: `${req.client.config.dashboard.baseURL}/${req.originalUrl}`
	});
});

module.exports = router;