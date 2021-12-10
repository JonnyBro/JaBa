const express = require("express"),
	router = express.Router(),
	CheckAuth = require("../auth/CheckAuth"),
	fs = require("fs"),
	marked = require("marked");

router.get("/", CheckAuth, function (req, res) {
	var md = function (filename) {
		return marked.parse(fs.readFileSync("./dashboard/views/docs/" + filename, "utf8"));
	};

	res.render("commands", {
		user: req.userInfos,
		translate: req.translate,
		currentURL: `${req.client.config.dashboard.baseURL}/${req.originalUrl}`,
		"md": md
	});
});

module.exports = router;