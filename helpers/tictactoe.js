// Thanks to simply-djs for this =)
// TODO: Refactor this please...

const { ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require("discord.js");

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @param {any[]}	options Array with options (everything is optional)
 * @param {string}	options.userSlash Name of the user option in the interaction
 * @param {string}	options.embedFooter Game's embed footer
 * @param {string}	options.embedColor Game's embed color
 * @param {string}	options.timeoutEmbedColor Game's embed timeout color
 * @param {string}	options.xEmoji Emoji for X
 * @param {string}	options.oEmoji Emoji for O
 * @param {string}	options.idleEmoji Emoji for "nothing"
 * @returns {Promise<import("discord.js").User>}
 */
async function tictactoe(interaction, options = {}) {
	return new Promise(resolve => {
		try {
			const { client } = interaction;
			let opponent;

			if (interaction.commandId) {
				opponent = interaction.options.getUser(options.userSlash || "user");

				if (!opponent)
					return interaction.reply({
						content: interaction.translate("fun/tictactoe:NO_USER"),
						ephemeral: true,
					});

				if (opponent.bot)
					return interaction.reply({
						content: interaction.translate("fun/tictactoe:BOT_USER"),
						ephemeral: true,
					});

				if (opponent.id == (interaction.user ? interaction.user : interaction.author).id)
					return interaction.reply({
						content: interaction.translate("misc:CANT_YOURSELF"),
						ephemeral: true,
					});
			} else if (!interaction.commandId) {
				opponent = interaction.mentions.members.first()?.user;

				if (!opponent)
					return interaction.reply({
						content: interaction.translate("fun/tictactoe:NO_USER"),
					});

				if (opponent.bot)
					return interaction.reply({
						content: interaction.translate("fun/tictactoe:BOT_USER"),
						ephemeral: true,
					});

				if (opponent.id === interaction.member.id)
					return interaction.reply({
						content: interaction.translate("misc:CANT_YOURSELF"),
					});
			}

			const footer = options.embedFooter || client.config.embed.footer,
				color = options.embedColor || client.config.embed.color,
				user = interaction.user ? interaction.user : interaction.author;

			const acceptEmbed = client.embed({
				author: {
					name: user.getUsername(),
					iconURL: user.displayAvatarURL(),
				},
				title: interaction.translate("fun/tictactoe:REQUEST_WAIT", {
					user: opponent.getUsername(),
				}),
				color,
				footer,
			});

			const accept = new ButtonBuilder().setLabel(interaction.translate("common:ACCEPT")).setStyle(ButtonStyle.Success).setCustomId("acceptttt");
			const decline = new ButtonBuilder().setLabel(interaction.translate("common:DECLINE")).setStyle(ButtonStyle.Danger).setCustomId("declinettt");
			const accep = new ActionRowBuilder().addComponents([accept, decline]);

			const m = interaction.reply({
				content: interaction.translate("fun/tictactoe:INVITE_USER", {
					opponent: opponent.id,
				}),
				embeds: [acceptEmbed],
				components: [accep],
				fetchReply: true,
			}).then(m => m);

			const collector = m.createMessageComponentCollector({
				componentType: ComponentType.Button,
				time: 30 * 1000,
			});
			collector.on("collect", async button => {
				if (button.user.id !== opponent.id)
					return button.reply({
						content: interaction.translate("fun/tictactoe:REQUEST_SEND", {
							opponent: opponent.id,
						}),
						ephemeral: true,
					});

				if (button.customId == "declinettt") {
					button.deferUpdate();
					return collector.stop("decline");
				} else if (button.customId == "acceptttt") {
					button.deferUpdate();
					collector.stop();

					const fighters = [(interaction.user ? interaction.user : interaction.author).id, opponent.id].sort(() => (Math.random() > 0.5 ? 1 : -1));

					const x_emoji = options.xEmoji || "❌";
					const o_emoji = options.oEmoji || "⭕";

					const dashmoji = options.idleEmoji || "➖";

					const Args = {
						user: 0,
						a1: {
							style: ButtonStyle.Secondary,
							emoji: dashmoji,
							disabled: false,
						},
						a2: {
							style: ButtonStyle.Secondary,
							emoji: dashmoji,
							disabled: false,
						},
						a3: {
							style: ButtonStyle.Secondary,
							emoji: dashmoji,
							disabled: false,
						},
						b1: {
							style: ButtonStyle.Secondary,
							emoji: dashmoji,
							disabled: false,
						},
						b2: {
							style: ButtonStyle.Secondary,
							emoji: dashmoji,
							disabled: false,
						},
						b3: {
							style: ButtonStyle.Secondary,
							emoji: dashmoji,
							disabled: false,
						},
						c1: {
							style: ButtonStyle.Secondary,
							emoji: dashmoji,
							disabled: false,
						},
						c2: {
							style: ButtonStyle.Secondary,
							emoji: dashmoji,
							disabled: false,
						},
						c3: {
							style: ButtonStyle.Secondary,
							emoji: dashmoji,
							disabled: false,
						},
					};

					const epm = client.embed({
						title: interaction.translate("fun/tictactoe:DESCRIPTION"),
						color,
						footer,
					});

					let msg;
					if (interaction.commandId)
						msg = await interaction.editReply({
							embeds: [
								epm.setDescription(
									interaction.translate("fun/tictactoe:WAITING", {
										user: Args.userid,
										emoji: client.emojis.cache.get(o_emoji) || "⭕",
									}),
								),
							],
						});
					else if (!interaction.commandId)
						msg = await button.message.edit({
							embeds: [
								epm.setDescription(
									interaction.translate("fun/tictactoe:WAITING", {
										user: Args.userid,
										emoji: client.emojis.cache.get(o_emoji) || "⭕",
									}),
								),
							],
						});

					await ttt(msg);

					// eslint-disable-next-line no-inner-declarations
					async function ttt(m) {
						Args.userid = fighters[Args.user];
						const won = {
							"<:O_:863314110560993340>": false,
							"<:X_:863314044781723668>": false,
						};

						const a1 = new ButtonBuilder().setStyle(Args.a1.style).setEmoji(Args.a1.emoji).setCustomId("a1").setDisabled(Args.a1.disabled);
						const a2 = new ButtonBuilder().setStyle(Args.a2.style).setEmoji(Args.a2.emoji).setCustomId("a2").setDisabled(Args.a2.disabled);
						const a3 = new ButtonBuilder().setStyle(Args.a3.style).setEmoji(Args.a3.emoji).setCustomId("a3").setDisabled(Args.a3.disabled);
						const b1 = new ButtonBuilder().setStyle(Args.b1.style).setEmoji(Args.b1.emoji).setCustomId("b1").setDisabled(Args.b1.disabled);
						const b2 = new ButtonBuilder().setStyle(Args.b2.style).setEmoji(Args.b2.emoji).setCustomId("b2").setDisabled(Args.b2.disabled);
						const b3 = new ButtonBuilder().setStyle(Args.b3.style).setEmoji(Args.b3.emoji).setCustomId("b3").setDisabled(Args.b3.disabled);
						const c1 = new ButtonBuilder().setStyle(Args.c1.style).setEmoji(Args.c1.emoji).setCustomId("c1").setDisabled(Args.c1.disabled);
						const c2 = new ButtonBuilder().setStyle(Args.c2.style).setEmoji(Args.c2.emoji).setCustomId("c2").setDisabled(Args.c2.disabled);
						const c3 = new ButtonBuilder().setStyle(Args.c3.style).setEmoji(Args.c3.emoji).setCustomId("c3").setDisabled(Args.c3.disabled);
						const a = new ActionRowBuilder().addComponents([a1, a2, a3]);
						const b = new ActionRowBuilder().addComponents([b1, b2, b3]);
						const c = new ActionRowBuilder().addComponents([c1, c2, c3]);
						const buttons = [a, b, c];

						if (Args.a1.emoji == o_emoji && Args.b1.emoji == o_emoji && Args.c1.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;

						if (Args.a2.emoji == o_emoji && Args.b2.emoji == o_emoji && Args.c2.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;

						if (Args.a3.emoji == o_emoji && Args.b3.emoji == o_emoji && Args.c3.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;

						if (Args.a1.emoji == o_emoji && Args.b2.emoji == o_emoji && Args.c3.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;

						if (Args.a3.emoji == o_emoji && Args.b2.emoji == o_emoji && Args.c1.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;

						if (Args.a1.emoji == o_emoji && Args.a2.emoji == o_emoji && Args.a3.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;

						if (Args.b1.emoji == o_emoji && Args.b2.emoji == o_emoji && Args.b3.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;

						if (Args.c1.emoji == o_emoji && Args.c2.emoji == o_emoji && Args.c3.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;

						if (won["<:O_:863314110560993340>"] != false)
							if (Args.user == 0) {
								const won = await client.users.fetch(fighters[1]).catch(console.error);
								resolve(won);

								if (options.resultBtn === true)
									return m
										.edit({
											content: interaction.translate("fun/tictactoe:WON", {
												winner: fighters[1],
												emoji: client.emojis.cache.get(o_emoji) || "⭕",
											}),
											components: buttons,

											embeds: [
												epm.setDescription(
													interaction.translate("fun/tictactoe:WON", {
														winner: fighters[1],
														emoji: client.emojis.cache.get(o_emoji) || "⭕",
													}),
												),
											],
										})
										.then(m => {
											m.react("⭕");
										});
								else if (!options.resultBtn || options.resultBtn === false)
									return m
										.edit({
											content: interaction.translate("fun/tictactoe:WON", {
												winner: fighters[1],
												emoji: client.emojis.cache.get(o_emoji) || "⭕",
											}),

											embeds: [
												epm.setDescription(
													`${interaction.translate("fun/tictactoe:WON", {
														winner: fighters[1],
														emoji: client.emojis.cache.get(o_emoji) || "⭕",
													})}\n\`\`\`\n${Args.a1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.a2.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.a3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.b1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.b2.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.b3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.c1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.c2.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.c3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n\`\`\``.replaceAll(dashmoji, "➖"),
												),
											],
											components: [],
										})
										.then(m => {
											m.react("⭕");
										});
							} else if (Args.user == 1) {
								const won = await client.users.fetch(fighters[0]).catch(console.error);
								resolve(won);

								if (options.resultBtn === true)
									return m
										.edit({
											content: interaction.translate("fun/tictactoe:WON", {
												winner: fighters[0],
												emoji: client.emojis.cache.get(o_emoji) || "⭕",
											}),
											components: buttons,
											embeds: [
												epm.setDescription(
													interaction.translate("fun/tictactoe:WON", {
														winner: fighters[0],
														emoji: client.emojis.cache.get(o_emoji) || "⭕",
													}),
												),
											],
										})
										.then(m => {
											m.react("⭕");
										});
								else if (!options.resultBtn || options.resultBtn === false)
									return m
										.edit({
											content: interaction.translate("fun/tictactoe:WON", {
												winner: fighters[0],
												emoji: client.emojis.cache.get(o_emoji) || "⭕",
											}),

											embeds: [
												epm.setDescription(
													`${interaction.translate("fun/tictactoe:WON", {
														winner: fighters[0],
														emoji: client.emojis.cache.get(o_emoji) || "⭕",
													})}\n\`\`\`\n${Args.a1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.a2.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.a3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.b1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.b2.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.b3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.c1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.c2.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.c3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n\`\`\``.replaceAll(dashmoji, "➖"),
												),
											],
											components: [],
										})
										.then(m => {
											m.react("⭕");
										});
							}

						if (Args.a1.emoji == x_emoji && Args.b1.emoji == x_emoji && Args.c1.emoji == x_emoji) won["<:X_:863314044781723668>"] = true;
						if (Args.a2.emoji == x_emoji && Args.b2.emoji == x_emoji && Args.c2.emoji == x_emoji) won["<:X_:863314044781723668>"] = true;
						if (Args.a3.emoji == x_emoji && Args.b3.emoji == x_emoji && Args.c3.emoji == x_emoji) won["<:X_:863314044781723668>"] = true;
						if (Args.a1.emoji == x_emoji && Args.b2.emoji == x_emoji && Args.c3.emoji == x_emoji) won["<:X_:863314044781723668>"] = true;
						if (Args.a3.emoji == x_emoji && Args.b2.emoji == x_emoji && Args.c1.emoji == x_emoji) won["<:X_:863314044781723668>"] = true;
						if (Args.a1.emoji == x_emoji && Args.a2.emoji == x_emoji && Args.a3.emoji == x_emoji) won["<:X_:863314044781723668>"] = true;
						if (Args.b1.emoji == x_emoji && Args.b2.emoji == x_emoji && Args.b3.emoji == x_emoji) won["<:X_:863314044781723668>"] = true;
						if (Args.c1.emoji == x_emoji && Args.c2.emoji == x_emoji && Args.c3.emoji == x_emoji) won["<:X_:863314044781723668>"] = true;
						if (won["<:X_:863314044781723668>"] != false)
							if (Args.user == 0) {
								const won = await client.users.fetch(fighters[1]).catch(console.error);
								resolve(won);

								if (options.resultBtn === true)
									return m
										.edit({
											content: interaction.translate("fun/tictactoe:WON", {
												winner: fighters[1],
												emoji: client.emojis.cache.get(o_emoji) || "⭕",
											}),
											components: buttons,
											embeds: [
												epm.setDescription(
													interaction.translate("fun/tictactoe:WON", {
														winner: fighters[1],
														emoji: client.emojis.cache.get(o_emoji) || "⭕",
													}),
												),
											],
										})
										.then(m => {
											m.react("❌");
										});
								else if (!options.resultBtn || options.resultBtn === false)
									return m
										.edit({
											content: interaction.translate("fun/tictactoe:WON", {
												winner: fighters[1],
												emoji: client.emojis.cache.get(o_emoji) || "⭕",
											}),
											embeds: [
												epm.setDescription(
													`${interaction.translate("fun/tictactoe:WON", {
														winner: fighters[1],
														emoji: client.emojis.cache.get(o_emoji) || "⭕",
													})}\n\`\`\`\n${Args.a1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.a2.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.a3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.b1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.b2.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.b3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.c1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.c2.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.c3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n\`\`\``.replaceAll(dashmoji, "➖"),
												),
											],
											components: [],
										})
										.then(m => {
											m.react("❌");
										});
							} else if (Args.user == 1) {
								const won = await client.users.fetch(fighters[0]).catch(console.error);
								resolve(won);

								if (options.resultBtn === true)
									return m
										.edit({
											content: interaction.translate("fun/tictactoe:WON", {
												winner: fighters[0],
												emoji: client.emojis.cache.get(o_emoji) || "⭕",
											}),
											components: buttons,
											embeds: [
												epm.setDescription(
													interaction.translate("fun/tictactoe:WON", {
														winner: fighters[0],
														emoji: client.emojis.cache.get(o_emoji) || "⭕",
													}),
												),
											],
										})
										.then(m => {
											m.react("❌");
										});
								else
									return m
										.edit({
											content: interaction.translate("fun/tictactoe:WON", {
												winner: fighters[0],
												emoji: client.emojis.cache.get(o_emoji) || "⭕",
											}),
											embeds: [
												epm.setDescription(
													`${interaction.translate("fun/tictactoe:WON", {
														winner: fighters[0],
														emoji: client.emojis.cache.get(o_emoji) || "⭕",
													})}\n\`\`\`\n${Args.a1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.a2.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.a3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.b1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.b2.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.b3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n${Args.c1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.c2.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.c3.emoji
														.replace(o_emoji, "⭕")
														.replace(x_emoji, "❌")}\n\`\`\``.replaceAll(dashmoji, "➖"),
												),
											],
											components: [],
										})
										.then(m => {
											m.react("❌");
										});
							}

						m.edit({
							content: `<@${Args.userid}>`,
							embeds: [
								epm.setDescription(
									interaction.translate("fun/tictactoe:WAITING", {
										user: Args.userid,
										emoji: Args.user == 0 ? `${client.emojis.cache.get(o_emoji) || "⭕"}` : `${client.emojis.cache.get(x_emoji) || "❌"}`,
									}),
								),
							],
							components: [a, b, c],
						});

						const collector = m.createMessageComponentCollector({
							componentType: ComponentType.Button,
							max: 1,
						});

						collector.on("collect", b => {
							if (b.user.id !== Args.userid) {
								b.reply({
									content: interaction.translate("fun/tictactoe:CANT_PLAY"),
									ephemeral: true,
								});

								ttt(m);
							} else {
								if (Args.user == 0) {
									Args.user = 1;
									Args[b.customId] = {
										style: ButtonStyle.Success,
										emoji: o_emoji,
										disabled: true,
									};
								} else {
									Args.user = 0;
									Args[b.customId] = {
										style: ButtonStyle.Danger,
										emoji: x_emoji,
										disabled: true,
									};
								}
								b.deferUpdate();
								const map = (obj, fun) =>
									Object.entries(obj).reduce(
										(prev, [key, value]) => ({
											...prev,
											[key]: fun(key, value),
										}),
										{},
									);
								const objectFilter = (obj, predicate) =>
									Object.keys(obj)
										.filter(key => predicate(obj[key]))
										.reduce((res, key) => ((res[key] = obj[key]), res), {});
								const Brgs = objectFilter(
									map(Args, (_, fruit) => fruit.emoji == dashmoji),
									num => num == true,
								);

								if (Object.keys(Brgs).length == 0) {
									if (Args.a1.emoji == o_emoji && Args.b1.emoji == o_emoji && Args.c1.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;
									if (Args.a2.emoji == o_emoji && Args.b2.emoji == o_emoji && Args.c2.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;
									if (Args.a3.emoji == o_emoji && Args.b3.emoji == o_emoji && Args.c3.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;
									if (Args.a1.emoji == o_emoji && Args.b2.emoji == o_emoji && Args.c3.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;
									if (Args.a3.emoji == o_emoji && Args.b2.emoji == o_emoji && Args.c1.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;
									if (Args.a1.emoji == o_emoji && Args.a2.emoji == o_emoji && Args.a3.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;
									if (Args.b1.emoji == o_emoji && Args.b2.emoji == o_emoji && Args.b3.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;
									if (Args.c1.emoji == o_emoji && Args.c2.emoji == o_emoji && Args.c3.emoji == o_emoji) won["<:O_:863314110560993340>"] = true;

									if (won["<:O_:863314110560993340>"] == true) return ttt(m);
									else if (won["<:X_:863314044781723668>"] == true) return;
									else {
										ttt(m);

										if (options.resultBtn === true)
											return m
												.edit({
													content: interaction.translate("fun/tictactoe:TIE"),
													embeds: [epm.setDescription(interaction.translate("fun/tictactoe:TIE_DESC"))],
												})
												.then(m => {
													m.react(dashmoji);
												});
										else
											return m
												.edit({
													content: interaction.translate("fun/tictactoe:TIE"),
													embeds: [
														epm.setDescription(
															`${interaction.translate("fun/tictactoe:TIE_DESC")}!\n\`\`\`\n${Args.a1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.a2.emoji
																.replace(o_emoji, "⭕")
																.replace(x_emoji, "❌")} | ${Args.a3.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")}\n${Args.b1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.b2.emoji
																.replace(o_emoji, "⭕")
																.replace(x_emoji, "❌")} | ${Args.b3.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")}\n${Args.c1.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")} | ${Args.c2.emoji
																.replace(o_emoji, "⭕")
																.replace(x_emoji, "❌")} | ${Args.c3.emoji.replace(o_emoji, "⭕").replace(x_emoji, "❌")}\n\`\`\``.replaceAll(dashmoji, "➖"),
														),
													],
													components: [],
												})
												.then(m => {
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
									content: interaction.translate("fun/tictactoe:NO_ANSWER", {
										user: Args.userid,
									}),
									components: [],
								});
						});
					}
				}
			});

			collector.on("end", (_, reason) => {
				if (reason == "time") {
					const embed = client.embed({
						author: {
							name: user.getUsername(),
							iconURL: user.displayAvatarURL(),
						},
						title: interaction.translate("fun/tictactoe:NO_ANSWER_TITLE"),
						description: interaction.translate("misc:TIMED_OUT"),
						color: options.timeoutEmbedColor || "#C90000",
						footer,
					});

					m.interaction.editReply({
						content: interaction.translate("fun/tictactoe:NOT_ANSWERED", {
							user: opponent.id,
						}),
						embeds: [embed],
						components: [],
					});
				}
				if (reason == "decline") {
					const embed = client.embed({
						author: {
							name: user.getUsername(),
							iconURL: user.displayAvatarURL(),
						},
						title: interaction.translate("fun/tictactoe:CANCELED"),
						description: interaction.translate("fun/tictactoe:CANCELED_DESC", {
							user: opponent.id,
						}),
						color: options.timeoutEmbedColor || "#C90000",
						footer,
					});

					m.interaction.editReply({
						embeds: [embed],
						components: [],
					});
				}
			});
		} catch (e) {
			console.log("TicTacToe errored:", e);
		}
	});
}

module.exports = tictactoe;
