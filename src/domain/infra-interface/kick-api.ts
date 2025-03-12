import { KickChannel, KickChannels } from "../model/kick-channel";

export interface KickApi {
  getLiveChannels(): Promise<KickChannel[]>;
  getFollowingChannels(offset: number): Promise<KickChannels>;
}
