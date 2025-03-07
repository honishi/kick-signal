import { KickApi } from "../domain/infra-interface/kick-api";
import { KickChannel } from "../domain/model/kick-channel";
import { KickChannelResponse } from "./model/kick-channel-response";

const API_BASE_URL = "https://kick.com";
const GET_FOLLOWING_CHANNELS_API_URL = `${API_BASE_URL}/api/v2/channels/followed`;

export class KickApiImpl implements KickApi {
  async getFollowingChannels(liveOnly: boolean): Promise<KickChannel[]> {
    const channels: KickChannel[] = [];
    let nextCursor: number | null = null;
    const MAX_PAGES = 10;
    let page = 0;
    do {
      const url = new URL(GET_FOLLOWING_CHANNELS_API_URL);
      if (nextCursor) {
        url.searchParams.append("cursor", nextCursor.toString());
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const json = await response.json();
      channels.push(
        ...json.channels
          .map((channel: KickChannelResponse) => this.toDomainChannel(channel))
          .filter((channel: KickChannel) => !liveOnly || channel.isLive),
      );
      const hasOfflineChannels = json.channels.some(
        (channel: KickChannelResponse) => !channel.is_live,
      );
      if (liveOnly && hasOfflineChannels) {
        // If offline channels are detected, we can safely exit the loop as no online channels will appear after this point.
        break;
      }
      nextCursor = json.nextCursor;
      page++;
    } while (nextCursor && page < MAX_PAGES);
    return channels;
  }

  private toDomainChannel(channel: KickChannelResponse): KickChannel {
    return {
      isLive: channel.is_live,
      profilePicture: channel.profile_picture,
      channelSlug: channel.channel_slug,
      viewerCount: channel.viewer_count,
      categoryName: channel.category_name,
      userUsername: channel.user_username,
      sessionTitle: channel.session_title,
    };
  }
}
