class Track {
	title = null;
	url = null;
	thumbnail = {};
	duration = null;
	type = null;
	description = null;
	views = null;
	channel = {};
	private = null;

	constructor(tracks) {
		if (!tracks) throw new Error("Constructor was not initialized properly!");
		this.title = tracks.title || tracks.videos?.title || tracks.video_details.title;
		this.url = tracks.url || tracks.videos.url || tracks.video_details.url;
		this.thumbnail = {
			url: tracks?.thumbnail.url || tracks.thumbnails[0].url,
		};
		this.duration = tracks.durationInSec || tracks.videos?.durationInSec || tracks.video_details.durationInSec;
		this.type = tracks.type;
		this.description = tracks?.description || tracks.videos?.description || tracks.video_details.description;
		this.views = tracks?.views || tracks.video_details.views;
		this.channel = {
			name: tracks?.channel.name || tracks.videos?.channel.name || tracks.video_details.channel.name,
			url: tracks?.channel.url || tracks.videos?.channel.url || tracks.video_details.channel.url,
		};
		this.private = tracks?.private || tracks?.videos?.private || tracks.video_details.private || false;
	}
}

module.exports = { Track };