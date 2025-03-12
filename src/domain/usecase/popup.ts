import { inject, injectable } from "tsyringe";

import { InjectTokens } from "../../di/inject-tokens";
import { BrowserApi } from "../infra-interface/browser-api";
import { KickApi } from "../infra-interface/kick-api";
import { KickChannels } from "../model/kick-channel";
import { defaultBadgeBackgroundColor, suspendedBadgeBackgroundColor } from "./colors";

export interface Popup {
  getFollowingChannels(offset: number): Promise<KickChannels>;
  setBadgeNumber(number: number): Promise<void>;
  isSuspended(): Promise<boolean>;
  setSuspended(suspended: boolean): Promise<void>;
  isDuplicateTabGuard(): Promise<boolean>;
  setDuplicateTabGuard(duplicateTabGuard: boolean): Promise<void>;
  openOptionsPage(): void;
  isAutoOpenUser(userId: string): Promise<boolean>;
  setAutoOpenUser(userId: string, enabled: boolean): Promise<void>;
}

@injectable()
export class PopupImpl implements Popup {
  constructor(
    @inject(InjectTokens.BrowserApi) private browserApi: BrowserApi,
    @inject(InjectTokens.KickApi) private kickApi: KickApi,
  ) {}

  async getFollowingChannels(offset: number): Promise<KickChannels> {
    return this.kickApi.getFollowingChannels(offset);
  }

  async setBadgeNumber(number: number): Promise<void> {
    await this.browserApi.setBadgeNumber(number);
  }

  async isSuspended(): Promise<boolean> {
    return (await this.browserApi.getSuspendFromDate()) !== undefined;
  }

  async setSuspended(suspended: boolean): Promise<void> {
    await this.browserApi.setSuspendFromDate(suspended ? new Date() : undefined);

    const isSuspended = await this.isSuspended();
    await this.browserApi.setBadgeBackgroundColor(
      isSuspended ? suspendedBadgeBackgroundColor : defaultBadgeBackgroundColor,
    );
  }

  async isDuplicateTabGuard(): Promise<boolean> {
    return await this.browserApi.isDuplicateTabGuard();
  }

  async setDuplicateTabGuard(duplicateTabGuard: boolean): Promise<void> {
    await this.browserApi.setDuplicateTabGuard(duplicateTabGuard);
  }

  openOptionsPage(): void {
    this.browserApi.openOptionsPage();
  }

  async isAutoOpenUser(userId: string): Promise<boolean> {
    return await this.browserApi.isAutoOpenChannel(userId);
  }

  async setAutoOpenUser(userId: string, enabled: boolean): Promise<void> {
    await this.browserApi.setAutoOpenChannel(userId, enabled);
  }
}
