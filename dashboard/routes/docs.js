const express = require("express"),
	router = express.Router();

router.get("/", function (req, res) {
	res.render("docs", {
		user: req.userInfos,
		translate: req.translate,
		currentURL: `${req.client.config.dashboard.baseURL}/${req.originalUrl}`
	});
});

module.exports = router;