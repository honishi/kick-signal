/*
{
	"channels": [
		{
			"is_live": true,
			"profile_picture": null,
			"channel_slug": "kurosawa2525",
			"viewer_count": 274,
			"category_name": "Just Chatting",
			"user_username": "kurosawa2525",
			"session_title": "rtmps://fa723fc1b171.global-contribute.live-video.net"
		},
		{
			"is_live": false,
			"profile_picture": "https://files.kick.com/images/user/9201758/profile_image/conversion/ce71aee0-c427-49b9-a7e0-bb7cd7a30d2d-thumb.webp",
			"channel_slug": "220ninimaru",
			"viewer_count": 0,
			"category_name": "",
			"user_username": "220ninimaru",
			"session_title": null
		},
		{
			"is_live": false,
			"profile_picture": "https://files.kick.com/images/user/56792416/profile_image/conversion/default5-thumb.webp",
			"channel_slug": "chippoiwatashi",
			"viewer_count": 0,
			"category_name": "",
			"user_username": "chippoiwatashi",
			"session_title": null
		}
	]
}
*/

export type KickChannel = {
  isLive: boolean;
  profilePicture: string | null;
  channelSlug: string;
  viewerCount: number;
  categoryName: string;
  userUsername: string;
  sessionTitle: string | null;
};

export type KickChannels = {
  next: number | null;
  channels: KickChannel[];
};
