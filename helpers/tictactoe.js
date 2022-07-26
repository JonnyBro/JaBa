// Thanks to simply-djs for this =)

const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");

/**
 * @param {require("discord.js").Message} message
 * @param {Array} options
 */
/**
  slash => Boolean

  userSlash => String

  resultBtn => Boolean

  embedFoot => String
  embedColor => HexColor
  timeoutEmbedColor => HexColor

  xEmoji => (Emoji ID) String

  oEmoji => (Emoji ID) String

  idleEmoji => (Emoji ID) String
 */
async function tictactoe(message, options = []) {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise(async (resolve) => {
		try {
			const { client } = message;
			let opponent;

			if (message.commandId) {
				opponent = message.options.getUser(options.userSlash || "user");

				if (!opponent)
					return message.reply({
						content: message.translate("economy/tictactoe:NO_USER"),
						ephemeral: true
					});

				if (opponent.bot)
					return message.reply({
						content: message.translate("economy/tictactoe:BOT_USER"),
						ephemeral: true
					});

				if (opponent.id == (message.user ? message.user : message.author).id)
					return message.reply({
						content: message.translate("economy/tictactoe:YOURSELF"),
						ephemeral: true
					});
			} else if (!message.commandId) {
				opponent = message.mentions.members.first()?.user;

				if (!opponent)
					return message.reply({
						content: message.translate("economy/tictactoe:NO_USER")
					});

				if (opponent.bot)
					return message.reply({
						content: message.translate("economy/tictactoe:BOT_USER"),
						ephemeral: true
					});

				if (opponent.id === message.member.id)
					return message.reply({
						content: message.translate("economy/tictactoe:YOURSELF")
					});
			}

			const foot = options.embedFoot ? { text: options.embedFoot } : { text: "Удачи =)" };

			const acceptEmbed = new MessageEmbed()
				.setTitle(message.translate("economy/tictactoe:REQUEST_WAIT", {
					user: opponent.tag
				}))
				.setAuthor({
					name: (message.user ? message.user : message.author).tag,
					iconURL: (message.user ? message.user : message.author).displayAvatarURL()
				})
				.setColor(options.embedColor || "#075FFF")
				.setFooter(foot)
				.setTimestamp();

			const accept = new MessageButton()
				.setLabel(message.translate("economy/tictactoe:ACCEPT"))
				.setStyle("SUCCESS")
				.setCustomId("acceptttt");

			const decline = new MessageButton()
				.setLabel(message.translate("economy/tictactoe:DECLINE"))
				.setStyle("DANGER")
				.setCustomId("declinettt");

			const accep = new MessageActionRow().addComponents([
				accept,
				decline
			]);

			let m;

			if (message.commandId) {
				m = await message.reply({
					content: message.translate("economy/tictactoe:INVITE_USER", {
						opponent: opponent.id
					}),
					embeds: [acceptEmbed],
					components: [accep]
				});
			} else if (!message.commandId) {
				m = await message.reply({
					content: message.translate("economy/tictactoe:INVITE_USER", {
						opponent: opponent.id
					}),
					embeds: [acceptEmbed],
					components: [accep]
				});
			}
			const collector = m.createMessageComponentCollector({
				type: "BUTTON",
				time: 30000
			});
			collector.on("collect", async (button) => {
				if (button.user.id !== opponent.id)
					return button.reply({
						content: message.translate("economy/tictactoe:REQUEST_SEND", {
							opponent: opponent.id
						}),
						ephemeral: true
					});

				if (button.customId == "declinettt") {
					button.deferUpdate();
					return collector.stop("decline");
				} else if (button.customId == "acceptttt") {
					collector.stop();
					if (message.commandId) button.message.delete();

					const fighters = [
						(message.user ? message.user : message.author).id,
						opponent.id
					].sort(() => (Math.random() > 0.5 ? 1 : -1));

					const x_emoji = options.xEmoji || "❌";
					const o_emoji = options.oEmoji || "⭕";

					const dashmoji = options.idleEmoji || "➖";

					const Args = {
						user: 0,
						a1: {
							style: "SECONDARY",
							emoji: dashmoji,
							disabled: false
						},
						a2: {
							style: "SECONDARY",
							emoji: dashmoji,
							disabled: false
						},
						a3: {
							style: "SECONDARY",
							emoji: dashmoji,
							disabled: false
						},
						b1: {
							style: "SECONDARY",
							emoji: dashmoji,
							disabled: false
						},
						b2: {
							style: "SECONDARY",
							emoji: dashmoji,
							disabled: false
						},
						b3: {
							style: "SECONDARY",
							emoji: dashmoji,
							disabled: false
						},
						c1: {
							style: "SECONDARY",
							emoji: dashmoji,
							disabled: false
						},
						c2: {
							style: "SECONDARY",
							emoji: dashmoji,
							disabled: false
						},
						c3: {
							style: "SECONDARY",
							emoji: dashmoji,
							disabled: false
						}
					};
					const { MessageActionRow, MessageButton } = require("discord.js");

					const epm = new MessageEmbed()
						.setTitle(message.translate("economy/tictactoe:DESCRIPTION"))
						.setColor(options.embedColor || "#075FFF")
						.setFooter(foot)
						.setTimestamp();

					let msg;
					if (message.commandId) {
						msg = await message.reply({
							embeds: [
								epm.setDescription(
									message.translate("economy/tictactoe:WAITING", {
										user: Args.userid,
										emoji: client.emojis.cache.get(o_emoji) || "⭕"
									})
								)
							]
						});
					} else if (!message.commandId) {
						msg = await button.message.edit({
							embeds: [
								epm.setDescription(
									message.translate("economy/tictactoe:WAITING", {
										user: Args.userid,
										emoji: client.emojis.cache.get(o_emoji) || "⭕"
									})
								)
							]
						});
					}

					await ttt(msg);

					// eslint-disable-next-line no-inner-declarations
					async function ttt(m) {
						Args.userid = fighters[Args.user];
						const won = {
							"<:O_:863314110560993340>": false,
							"<:X_:863314044781723668>": false
						};

						const a1 = new MessageButton()
							.setStyle(Args.a1.style)
							.setEmoji(Args.a1.emoji)
							.setCustomId("a1")
							.setDisabled(Args.a1.disabled);
						const a2 = new MessageButton()
							.setStyle(Args.a2.style)
							.setEmoji(Args.a2.emoji)
							.setCustomId("a2")
							.setDisabled(Args.a2.disabled);
						const a3 = new MessageButton()
							.setStyle(Args.a3.style)
							.setEmoji(Args.a3.emoji)
							.setCustomId("a3")
							.setDisabled(Args.a3.disabled);
						const b1 = new MessageButton()
							.setStyle(Args.b1.style)
							.setEmoji(Args.b1.emoji)
							.setCustomId("b1")
							.setDisabled(Args.b1.disabled);
						const b2 = new MessageButton()
							.setStyle(Args.b2.style)
							.setEmoji(Args.b2.emoji)
							.setCustomId("b2")
							.setDisabled(Args.b2.disabled);
						const b3 = new MessageButton()
							.setStyle(Args.b3.style)
							.setEmoji(Args.b3.emoji)
							.setCustomId("b3")
							.setDisabled(Args.b3.disabled);
						const c1 = new MessageButton()
							.setStyle(Args.c1.style)
							.setEmoji(Args.c1.emoji)
							.setCustomId("c1")
							.setDisabled(Args.c1.disabled);
						const c2 = new MessageButton()
							.setStyle(Args.c2.style)
							.setEmoji(Args.c2.emoji)
							.setCustomId("c2")
							.setDisabled(Args.c2.disabled);
						const c3 = new MessageButton()
							.setStyle(Args.c3.style)
							.setEmoji(Args.c3.emoji)
							.setCustomId("c3")
							.setDisabled(Args.c3.disabled);
						const a = new MessageActionRow().addComponents([a1, a2, a3]);
						const b = new MessageActionRow().addComponents([b1, b2, b3]);
						const c = new MessageActionRow().addComponents([c1, c2, c3]);
						const buttons = [a, b, c];

						if (
							Args.a1.emoji == o_emoji &&
							Args.b1.emoji == o_emoji &&
							Args.c1.emoji == o_emoji
						)
							won["<:O_:863314110560993340>"] = true;
						if (
							Args.a2.emoji == o_emoji &&
							Args.b2.emoji == o_emoji &&
							Args.c2.emoji == o_emoji
						)
							won["<:O_:863314110560993340>"] = true;
						if (
							Args.a3.emoji == o_emoji &&
							Args.b3.emoji == o_emoji &&
							Args.c3.emoji == o_emoji
						)
							won["<:O_:863314110560993340>"] = true;
						if (
							Args.a1.emoji == o_emoji &&
							Args.b2.emoji == o_emoji &&
							Args.c3.emoji == o_emoji
						)
							won["<:O_:863314110560993340>"] = true;
						if (
							Args.a3.emoji == o_emoji &&
							Args.b2.emoji == o_emoji &&
							Args.c1.emoji == o_emoji
						)
							won["<:O_:863314110560993340>"] = true;
						if (
							Args.a1.emoji == o_emoji &&
							Args.a2.emoji == o_emoji &&
							Args.a3.emoji == o_emoji
						)
							won["<:O_:863314110560993340>"] = true;
						if (
							Args.b1.emoji == o_emoji &&
							Args.b2.emoji == o_emoji &&
							Args.b3.emoji == o_emoji
						)
							won["<:O_:863314110560993340>"] = true;
						if (
							Args.c1.emoji == o_emoji &&
							Args.c2.emoji == o_emoji &&
							Args.c3.emoji == o_emoji
						)
							won["<:O_:863314110560993340>"] = true;
						if (won["<:O_:863314110560993340>"] != false) {
							if (Args.user == 0) {
								const wonner = await client.users
									.fetch(fighters[1])
									.catch(console.error);
								resolve(wonner);

								if (options.resultBtn === true)
									return m
										.edit({
											content: message.translate("economy/tictactoe:WON", {
												winner: fighters[1],
												emoji: client.emojis.cache.get(o_emoji) || "⭕"
											}),
											components: buttons,

											embeds: [
												epm.setDescription(
													message.translate("economy/tictactoe:WON", {
														winner: fighters[1],
														emoji: client.emojis.cache.get(o_emoji) || "⭕"
													})
												)
											]
										})
										.then((m) => {
											m.react("⭕");
										});
								else if (!options.resultBtn || options.resultBtn === false)
									return m
										.edit({
											content: message.translate("economy/tictactoe:WON", {
												winner: fighters[1],
												emoji: client.emojis.cache.get(o_emoji) || "⭕"
											}),

											embeds: [
												epm.setDescription(
													`${message.translate("economy/tictactoe:WON", {
														winner: fighters[1],
														emoji: client.emojis.cache.get(o_emoji) || "⭕"
													})}\n\`\`\`\n${Args.a1.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.a2.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.a3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.b1.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.b2.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.b3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.c1.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.c2.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.c3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n\`\`\``.replaceAll(
														dashmoji,
														"➖"
													)
												)
											],
											components: []
										})
										.then((m) => {
											m.react("⭕");
										});
							} else if (Args.user == 1) {
								const wonner = await client.users
									.fetch(fighters[0])
									.catch(console.error);
								resolve(wonner);

								if (options.resultBtn === true)
									return m
										.edit({
											content: message.translate("economy/tictactoe:WON", {
												winner: fighters[0],
												emoji: client.emojis.cache.get(o_emoji) || "⭕"
											}),
											components: buttons,
											embeds: [
												epm.setDescription(
													message.translate("economy/tictactoe:WON", {
														winner: fighters[0],
														emoji: client.emojis.cache.get(o_emoji) || "⭕"
													})
												)
											]
										})
										.then((m) => {
											m.react("⭕");
										});
								else if (!options.resultBtn || options.resultBtn === false)
									return m
										.edit({
											content: message.translate("economy/tictactoe:WON", {
												winner: fighters[0],
												emoji: client.emojis.cache.get(o_emoji) || "⭕"
											}),

											embeds: [
												epm.setDescription(
													`${message.translate("economy/tictactoe:WON", {
														winner: fighters[0],
														emoji: client.emojis.cache.get(o_emoji) || "⭕"
													})}\n\`\`\`\n${Args.a1.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.a2.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.a3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.b1.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.b2.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.b3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.c1.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.c2.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.c3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n\`\`\``.replaceAll(
														dashmoji,
														"➖"
													)
												)
											],
											components: []
										})
										.then((m) => {
											m.react("⭕");
										});
							}
						}
						if (
							Args.a1.emoji == x_emoji &&
							Args.b1.emoji == x_emoji &&
							Args.c1.emoji == x_emoji
						)
							won["<:X_:863314044781723668>"] = true;
						if (
							Args.a2.emoji == x_emoji &&
							Args.b2.emoji == x_emoji &&
							Args.c2.emoji == x_emoji
						)
							won["<:X_:863314044781723668>"] = true;
						if (
							Args.a3.emoji == x_emoji &&
							Args.b3.emoji == x_emoji &&
							Args.c3.emoji == x_emoji
						)
							won["<:X_:863314044781723668>"] = true;
						if (
							Args.a1.emoji == x_emoji &&
							Args.b2.emoji == x_emoji &&
							Args.c3.emoji == x_emoji
						)
							won["<:X_:863314044781723668>"] = true;
						if (
							Args.a3.emoji == x_emoji &&
							Args.b2.emoji == x_emoji &&
							Args.c1.emoji == x_emoji
						)
							won["<:X_:863314044781723668>"] = true;
						if (
							Args.a1.emoji == x_emoji &&
							Args.a2.emoji == x_emoji &&
							Args.a3.emoji == x_emoji
						)
							won["<:X_:863314044781723668>"] = true;
						if (
							Args.b1.emoji == x_emoji &&
							Args.b2.emoji == x_emoji &&
							Args.b3.emoji == x_emoji
						)
							won["<:X_:863314044781723668>"] = true;
						if (
							Args.c1.emoji == x_emoji &&
							Args.c2.emoji == x_emoji &&
							Args.c3.emoji == x_emoji
						)
							won["<:X_:863314044781723668>"] = true;
						if (won["<:X_:863314044781723668>"] != false) {
							if (Args.user == 0) {
								const wonner = await client.users
									.fetch(fighters[1])
									.catch(console.error);
								resolve(wonner);

								if (options.resultBtn === true)
									return m
										.edit({
											content: message.translate("economy/tictactoe:WON", {
												winner: fighters[1],
												emoji: client.emojis.cache.get(o_emoji) || "⭕"
											}),
											components: buttons,
											embeds: [
												epm.setDescription(
													message.translate("economy/tictactoe:WON", {
														winner: fighters[1],
														emoji: client.emojis.cache.get(o_emoji) || "⭕"
													})
												)
											]
										})
										.then((m) => {
											m.react("❌");
										});
								else if (!options.resultBtn || options.resultBtn === false)
									return m
										.edit({
											content: message.translate("economy/tictactoe:WON", {
												winner: fighters[1],
												emoji: client.emojis.cache.get(o_emoji) || "⭕"
											}),
											embeds: [
												epm.setDescription(
													`${message.translate("economy/tictactoe:WON", {
														winner: fighters[1],
														emoji: client.emojis.cache.get(o_emoji) || "⭕"
													})}\n\`\`\`\n${Args.a1.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.a2.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.a3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.b1.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.b2.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.b3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.c1.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.c2.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.c3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n\`\`\``.replaceAll(
														dashmoji,
														"➖"
													)
												)
											],
											components: []
										})
										.then((m) => {
											m.react("❌");
										});
							} else if (Args.user == 1) {
								const wonner = await client.users
									.fetch(fighters[0])
									.catch(console.error);
								resolve(wonner);

								if (options.resultBtn === true)
									return m
										.edit({
											content: message.translate("economy/tictactoe:WON", {
												winner: fighters[0],
												emoji: client.emojis.cache.get(o_emoji) || "⭕"
											}),
											components: buttons,
											embeds: [
												epm.setDescription(
													message.translate("economy/tictactoe:WON", {
														winner: fighters[0],
														emoji: client.emojis.cache.get(o_emoji) || "⭕"
													})
												)
											]
										})
										.then((m) => {
											m.react("❌");
										});
								else
									return m
										.edit({
											content: message.translate("economy/tictactoe:WON", {
												winner: fighters[0],
												emoji: client.emojis.cache.get(o_emoji) || "⭕"
											}),
											embeds: [
												epm.setDescription(
													`${message.translate("economy/tictactoe:WON", {
														winner: fighters[0],
														emoji: client.emojis.cache.get(o_emoji) || "⭕"
													})}\n\`\`\`\n${Args.a1.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.a2.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.a3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.b1.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.b2.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.b3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.c1.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.c2.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")} | ${Args.c3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n\`\`\``.replaceAll(
														dashmoji,
														"➖"
													)
												)
											],
											components: []
										})
										.then((m) => {
											m.react("❌");
										});
							}
						}

						m.edit({
							content: `<@${Args.userid}>`,
							embeds: [
								epm.setDescription(
									message.translate("economy/tictactoe:WAITING", {
										user: Args.userid,
										emoji: Args.user == 0 ? `${client.emojis.cache.get(o_emoji) || "⭕"}` : `${client.emojis.cache.get(x_emoji) || "❌"}`
									})
								)
							],
							components: [a, b, c]
						});

						const collector = m.createMessageComponentCollector({
							componentType: "BUTTON",
							max: 1,
							time: 30000
						});

						collector.on("collect", (b) => {
							if (b.user.id !== Args.userid) {
								b.reply({
									content: message.translate("economy/tictactoe:CANT_PLAY"),
									ephemeral: true
								});

								ttt(m);
							} else {
								if (Args.user == 0) {
									Args.user = 1;
									Args[b.customId] = {
										style: "SUCCESS",
										emoji: o_emoji,
										disabled: true
									};
								} else {
									Args.user = 0;
									Args[b.customId] = {
										style: "DANGER",
										emoji: x_emoji,
										disabled: true
									};
								}
								b.deferUpdate();
								const map = (obj, fun) =>
									Object.entries(obj).reduce(
										(prev, [key, value]) => ({
											...prev,
											[key]: fun(key, value)
										}), {}
									);
								const objectFilter = (obj, predicate) =>
									Object.keys(obj)
										.filter((key) => predicate(obj[key]))
										.reduce((res, key) => ((res[key] = obj[key]), res), {});
								const Brgs = objectFilter(
									map(Args, (_, fruit) => fruit.emoji == dashmoji),
									(num) => num == true
								);

								if (Object.keys(Brgs).length == 0) {
									if (
										Args.a1.emoji == o_emoji &&
										Args.b1.emoji == o_emoji &&
										Args.c1.emoji == o_emoji
									)
										won["<:O_:863314110560993340>"] = true;
									if (
										Args.a2.emoji == o_emoji &&
										Args.b2.emoji == o_emoji &&
										Args.c2.emoji == o_emoji
									)
										won["<:O_:863314110560993340>"] = true;
									if (
										Args.a3.emoji == o_emoji &&
										Args.b3.emoji == o_emoji &&
										Args.c3.emoji == o_emoji
									)
										won["<:O_:863314110560993340>"] = true;
									if (
										Args.a1.emoji == o_emoji &&
										Args.b2.emoji == o_emoji &&
										Args.c3.emoji == o_emoji
									)
										won["<:O_:863314110560993340>"] = true;
									if (
										Args.a3.emoji == o_emoji &&
										Args.b2.emoji == o_emoji &&
										Args.c1.emoji == o_emoji
									)
										won["<:O_:863314110560993340>"] = true;
									if (
										Args.a1.emoji == o_emoji &&
										Args.a2.emoji == o_emoji &&
										Args.a3.emoji == o_emoji
									)
										won["<:O_:863314110560993340>"] = true;
									if (
										Args.b1.emoji == o_emoji &&
										Args.b2.emoji == o_emoji &&
										Args.b3.emoji == o_emoji
									)
										won["<:O_:863314110560993340>"] = true;
									if (
										Args.c1.emoji == o_emoji &&
										Args.c2.emoji == o_emoji &&
										Args.c3.emoji == o_emoji
									)
										won["<:O_:863314110560993340>"] = true;

									if (won["<:O_:863314110560993340>"] == true) return ttt(m);
									else if (won["<:X_:863314044781723668>"] == true) return;
									else {
										ttt(m);

										if (options.resultBtn === true)
											return m
												.edit({
													content: message.translate("economy/tictactoe:TIE"),
													embeds: [epm.setDescription(message.translate("economy/tictactoe:TIE_DESC"))]
												})
												.then((m) => {
													m.react(dashmoji);
												});
										else
											return m
												.edit({
													content: message.translate("economy/tictactoe:TIE"),
													embeds: [
														epm.setDescription(
															`${message.translate("economy/tictactoe:TIE_DESC")}!\n\`\`\`\n${Args.a1.emoji
																.replace(o_emoji, "⭕")
																.replace(x_emoji, "❌")} | ${Args.a2.emoji
																.replace(o_emoji, "⭕")
																.replace(x_emoji, "❌")} | ${Args.a3.emoji
																.replace(o_emoji, "⭕")
																.replace(x_emoji, "❌")}\n${Args.b1.emoji
																.replace(o_emoji, "⭕")
																.replace(x_emoji, "❌")} | ${Args.b2.emoji
																.replace(o_emoji, "⭕")
																.replace(x_emoji, "❌")} | ${Args.b3.emoji
																.replace(o_emoji, "⭕")
																.replace(x_emoji, "❌")}\n${Args.c1.emoji
																.replace(o_emoji, "⭕")
																.replace(x_emoji, "❌")} | ${Args.c2.emoji
																.replace(o_emoji, "⭕")
																.replace(x_emoji, "❌")} | ${Args.c3.emoji
																.replace(o_emoji, "⭕")
																.replace(x_emoji, "❌")}\n\`\`\``.replaceAll(
																dashmoji,
																"➖"
															)
														)
													],
													components: []
												})
												.then((m) => {
													m.react(dashmoji);
												})
												.catch(() => {});
									}
								}

								ttt(m);
							}
						});
						collector.on("end", (collected, reason) => {
							if (collected.size === 0 && reason == "time")
								m.edit({
									content: message.translate("economy/tictactoe:NO_ANSWER", {
										user: Args.userid
									}),
									components: []
								});
						});
					}
				}
			});

			collector.on("end", (collected, reason) => {
				if (reason == "time") {
					const embed = new MessageEmbed()
						.setTitle(message.translate("economy/tictactoe:NO_ANSWER_TITLE"))
						.setAuthor({
							name: (message.user ? message.user : message.author).tag,
							iconURL: (message.user ? message.user : message.author).displayAvatarURL()
						})
						.setColor(options.timeoutEmbedColor || "#C90000")
						.setFooter(foot)
						.setTimestamp()
						.setDescription(message.translate("economy/tictactoe:TIMES_UP"));
					m.edit({
						content: message.translate("economy/tictactoe:NOT_ANSWERED", {
							user: opponent.id
						}),
						embeds: [embed],
						components: []
					});
				}
				if (reason == "decline") {
					const embed = new MessageEmbed()
						.setTitle(message.translate("economy/tictactoe:CANCELED"))
						.setAuthor({
							name: (message.user ? message.user : message.author).tag,
							iconURL: (message.user ? message.user : message.author).displayAvatarURL()
						})
						.setColor(options.timeoutEmbedColor || "#C90000")
						.setFooter(foot)
						.setTimestamp()
						.setDescription(message.translate("economy/tictactoe:CANCELED_DESC", {
							user: opponent.id
						}));
					m.edit({
						embeds: [embed],
						components: []
					});
				}
			});
		} catch (err) {
			console.log(`tictactoe | ERROR: ${err.stack}`);
		}
	});
}

module.exports = tictactoe;