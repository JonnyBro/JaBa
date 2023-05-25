const express = require("express"),
	router = express.Router();

router.get("/", function (req, res) {
	res.set("Access-Control-Allow-Origin", "*");

	res.render("docs", {
		user: req.userInfos,
		translate: req.translate,
		currentURL: `${req.client.config.dashboard.baseURL}${req.originalUrl}`,
		site: req.client.config.dashboard.baseURL,
	});
});

module.exports = router;