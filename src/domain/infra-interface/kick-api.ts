import { KickChannel } from "../model/kick-channel";

export interface KickApi {
  getFollowingChannels(liveOnly: boolean): Promise<KickChannel[]>;
}
