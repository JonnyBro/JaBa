const express = require("express"),
	router = express.Router(),
	fs = require("fs"),
	marked = require("marked");

router.get("/", function (req, res) {
	var md = function (filename) {
		return marked.parse(fs.readFileSync("./dashboard/views/docs/" + filename, "utf8"));
	};

	res.render("updates", {
		user: req.userInfos,
		translate: req.translate,
		currentURL: `${req.client.config.dashboard.baseURL}/${req.originalUrl}`,
		"md": md
	});
});

module.exports = router;