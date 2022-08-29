const playdl = require("play-dl"),
	fallbackImage = "https://cdn.discordapp.com/attachments/708642702602010684/1012418217660121089/noimage.png";
// const fetch = require("node-fetch");
// const { getData, getPreview, getTracks } = require("spotify-url-info")(fetch);

/*
	Thanks to: https://github.com/nizewn/Dodong

	hello stranger,

	as a result of my headaches while dealing with the discord-player extractor API,
	what you will see here will mostly be poorly-written code.
	this could use modularisation or some cleanup (i might do it once i have free time)

	thanks :)

	-nize
*/

module.exports = {
	important: true,
	validate: () => true, // true, since we're also using this for searches when query isnt a valid link
	/**
	 *
	 * @param {String} query
	 * @returns
	 */
	getInfo: async (query) => {
		// eslint-disable-next-line no-async-promise-executor, no-unused-vars
		return new Promise(async (resolve, reject) => {
			try {
				// ---- start soundcloud ----
				if (["track", "playlist"].includes(await playdl.so_validate(query))) {
					const info = await playdl.soundcloud(query);
					if (info.type === "track") {
						const track = {
							title: info.name,
							duration: info.durationInMs,
							thumbnail: info.thumbnail || fallbackImage,
							async engine() {
								return (await playdl.stream(info.url, { discordPlayerCompatibility: true })).stream;
							},
							views: 0,
							author: info.publisher ? info.publisher.name ?? info.publisher.artist ?? info.publisher.writer_composer ?? null : null,
							description: "",
							url: info.url,
							source: "soundcloud-custom"
						};
						return resolve({ playlist: null, info: [track] });
					} else if (info.type === "playlist") {
						const trackList = await info.all_tracks();
						const tracks = await trackList.map(track => {
							return {
								title: track.name,
								duration: track.durationInMs,
								thumbnail: track.thumbnail || fallbackImage,
								async engine() {
									return (await playdl.stream(track.url, { discordPlayerCompatibility: true })).stream;
								},
								views: 0,
								author: track.publisher ? track.publisher.name ?? track.publisher.artist ?? track.publisher.writer_composer ?? null : null,
								description: "",
								url: track.url,
								source: "soundcloud-custom"
							};
						});
						const playlist = {
							title: info.name,
							description: "",
							thumbnail: info.user.thumbnail || fallbackImage,
							type: "playlist",
							source: "soundcloud-custom",
							author: info.user.name,
							id: info.id,
							url: info.url,
							rawPlaylist: info
						};
						return resolve({ playlist: playlist, info: tracks });
					}
				}
				// ---- end soundcloud ----
				/*
				// ---- start spotify ----
				if (query.includes("open.spotify.com") || query.includes("play.spotify.com")) {
					const info = await getPreview(query);
					if (info.type === "track") {
						const spotifyTrack = await getData(query);
						const track = {
							title: info.title,
							duration: spotifyTrack.duration_ms,
							thumbnail: info.image,
							async engine() {
								return (await playdl.stream(await Youtube.search(`${info.artist} ${info.title} lyric`, { limit: 1, type: "video", safeSearch: true }).then(x => x[0] ? `https://youtu.be/${x[0].id}` : "https://youtu.be/Wch3gJG2GJ4"), { discordPlayerCompatibility: true })).stream;
							},
							views: 0,
							author: info.artist,
							description: "",
							url: info.link,
							source: "spotify-custom"
						};
						return resolve({ playlist: null, info: [track] });
					} else if (["album", "artist", "playlist"].includes(info.type)) {
						const trackList = await getTracks(query);
						const tracks = trackList.map(track => {
							return {
								title: track.name,
								duration: track.duration_ms,
								thumbnail: track.album && track.album.images.length ? track.album.images[0].url : null,
								async engine() {
									return (await playdl.stream(await Youtube.search(`${track.artists[0].name} ${track.name} lyric`, { limit: 1, type: "video", safeSearch: true }).then(x => x[0] ? `https://youtu.be/${x[0].id}` : "https://youtu.be/Wch3gJG2GJ4"), { discordPlayerCompatibility: true })).stream;
								},
								views: 0,
								author: track.artists ? track.artists[0].name : null,
								description: "",
								url: track.external_urls.spotify,
								source: "spotify-custom"
							};
						});
						const playlist = {
							title: info.title,
							description: "",
							thumbnail: info.image,
							type: info.type === "album" ? "album" : "playlist",
							source: "spotify-custom",
							author: info.artist,
							id: null,
							url: info.link,
							rawPlaylist: info
						};
						return resolve({ playlist: playlist, info: tracks });
					}
				}
				// ---- end spotify ----
				*/
				if (query.startsWith("http") && !query.includes("&list")) query = query.split("&")[0];

				if (query.startsWith("http") && playdl.yt_validate(query) === "video") {
					if (query.includes("music.youtube")) {
						const info = await playdl.video_info(query);
						if (!info) return resolve({ playlist: null, info: null });
						const track = {
							title: info.video_details.title,
							duration: info.video_details.durationInSec * 1000,
							thumbnail: info.video_details.thumbnails[0].url || fallbackImage,
							async engine() {
								return (await playdl.stream(`https://music.youtube.com/watch?v=${info.video_details.id}`, { discordPlayerCompatibility: true })).stream;
							},
							views: info.video_details.views,
							author: info.video_details.channel.name,
							description: "",
							url: `https://music.youtube.com/watch?v=${info.video_details.id}`,
							raw: info,
							source: "youtube"
						};

						return resolve({ playlist: null, info: [track] });
					}

					const info = await playdl.video_info(query);
					if (!info) return resolve({ playlist: null, info: null });

					const track = {
						title: info.video_details.title,
						duration: info.video_details.durationInSec * 1000,
						thumbnail: info.video_details.thumbnails[0].url || fallbackImage,
						async engine() {
							return (await playdl.stream(info.video_details.url, { discordPlayerCompatibility: true })).stream;
						},
						views: info.video_details.views,
						author: info.video_details.channel.name,
						description: "",
						url: info.video_details.url,
						raw: info,
						source: "youtube"
					};
					return resolve({ playlist: null, info: [track] });
				} else if (playdl.yt_validate(query) === "playlist") {
					if (query.includes("music.youtube")) {
						const info = await playdl.playlist_info(query, { incomplete: true });
						const trackList = await info.videos;
						const tracks = trackList.map(track => {
							return {
								title: track.title,
								duration: track.durationInSec * 1000,
								thumbnail: track.thumbnails[0].url || fallbackImage,
								async engine() {
									return (await playdl.stream(`https://music.youtube.com/watch?v=${track.id}`, { discordPlayerCompatibility: true })).stream;
								},
								views: track.views,
								author: track.channel.name,
								description: "",
								url: track.url,
								raw: info,
								source: "youtube"
							};
						});
						const playlist = {
							title: info.title,
							description: "",
							thumbnail: info.thumbnail ? info.thumbnail.url : fallbackImage,
							type: "playlist",
							author: info.channel.name,
							id: info.id,
							url: info.url,
							source: "youtube",
							rawPlaylist: info
						};
						return resolve({ playlist: playlist, info: tracks });
					}

					const info = await playdl.playlist_info(query, { incomplete: true });
					const trackList = await info.all_videos();
					const tracks = trackList.map(track => {
						return {
							title: track.title,
							duration: track.durationInSec * 1000,
							thumbnail: track.thumbnails[0].url || fallbackImage,
							async engine() {
								return (await playdl.stream(track.url, { discordPlayerCompatibility: true })).stream;
							},
							views: track.views,
							author: track.channel.name,
							description: "",
							url: track.url,
							raw: info,
							source: "youtube"
						};
					});
					const playlist = {
						title: info.title,
						description: "",
						thumbnail: info.thumbnail ? info.thumbnail.url : null,
						type: "playlist",
						source: "youtube",
						author: info.channel.name,
						id: info.id,
						url: info.url,
						rawPlaylist: info
					};
					return resolve({ playlist: playlist, info: tracks });
				}

				// search on youtube
				const search = await playdl.search(query, { limit: 10 });

				if (search) {
					const found = search.map(track => {
						return {
							title: track.title,
							duration: track.durationInSec * 1000,
							thumbnail: track.thumbnails[0].url || fallbackImage,
							async engine() {
								return (await playdl.stream(track.url, { discordPlayerCompatibility: true })).stream;
							},
							views: track.views,
							author: track.channel.name,
							description: "search",
							url: track.url,
							raw: track,
							source: "youtube"
						};
					});

					return resolve({ playlist: null, info: found });
				}

				return resolve({ playlist: null, info: null });
			} catch (error) {
				console.log(`Extractor: An error occurred while attempting to resolve ${query} :\n${error}`);
				return reject(error);
			}
		});
	}
};