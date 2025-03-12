import { inject, injectable } from "tsyringe";

import { InjectTokens } from "../../di/inject-tokens";
import { BrowserApi } from "../infra-interface/browser-api";
import { KickApi } from "../infra-interface/kick-api";
import { KickChannel } from "../model/kick-channel";
import { SoundType } from "../model/sound-type";
import { defaultBadgeBackgroundColor } from "./colors";

const RUN_INTERVAL = 1000 * 60; // 1 minute
const DELAY_AFTER_OPEN = 1000 * 5; // 5 seconds

export interface Background {
  run(): Promise<void>;
  openNotification(notificationId: string): Promise<void>;
}

@injectable()
export class BackgroundImpl implements Background {
  private isRunning = false;
  private lastChannelCheckTime?: Date;
  private liveChannelSlugs: Set<string> = new Set();
  private notifiedLives: { [key: string]: string } = {}; // key: notificationId, value: liveUrl

  constructor(
    @inject(InjectTokens.BrowserApi) private browserApi: BrowserApi,
    @inject(InjectTokens.KickApi) private kickApi: KickApi,
  ) {
    this.initialize().then(() => console.log("Background initialized"));
  }

  async initialize(): Promise<void> {
    await this.resetSuspended();
  }

  async resetSuspended(): Promise<void> {
    await this.browserApi.setSuspendFromDate(undefined);
    await this.browserApi.setBadgeBackgroundColor(defaultBadgeBackgroundColor);
  }

  async run(): Promise<void> {
    if (this.isRunning) {
      console.log("Background run: already running");
      return;
    }
    console.log("Background run: start");
    this.isRunning = true;

    await this.browserApi.startSendingKeepAliveFromOffscreen();
    await this.requestChannelsIgnoringError();
    setInterval(async () => {
      await this.requestChannelsIgnoringError();
    }, RUN_INTERVAL);

    console.log("Background run: end");
  }

  async openNotification(notificationId: string): Promise<void> {
    const url = this.notifiedLives[notificationId];
    if (url === undefined) {
      console.log(
        `Background openNotification: url is undefined. notificationId=${notificationId}`,
      );
      return;
    }
    await this.browserApi.openTab(url);
  }

  private async requestChannelsIgnoringError(): Promise<void> {
    try {
      await this.requestChannels();
    } catch (e) {
      console.log(`Failed to request channels: ${e}`);
    }
  }

  private async requestChannels(): Promise<void> {
    console.log("Background requestChannels: start", new Date());

    const channels = await this.kickApi.getLiveChannels();
    await this.browserApi.setBadgeNumber(channels.length);
    await this.checkChannels(channels);

    console.log("Background requestChannels: end", new Date());
  }

  private async checkChannels(channels: KickChannel[]): Promise<void> {
    if (this.lastChannelCheckTime === undefined) {
      // Skip notifications and auto-launch on the first check
      this.lastChannelCheckTime = new Date();
      this.liveChannelSlugs = new Set(channels.filter((c) => c.isLive).map((c) => c.channelSlug));
      return;
    }
    this.lastChannelCheckTime = new Date();

    const showNotification = await this.browserApi.getShowNotification();
    const isSuspended = (await this.browserApi.getSuspendFromDate()) !== undefined;

    let openedAnyPrograms = false;
    for (const channel of channels) {
      this.logChannel("Found following channel:", channel);
      const becomesLive = !this.liveChannelSlugs.has(channel.channelSlug) && channel.isLive;
      if (!becomesLive) {
        continue;
      }
      if (openedAnyPrograms) {
        console.log(`wait: ${DELAY_AFTER_OPEN} ms`);
        await this.delay(DELAY_AFTER_OPEN);
      }
      if (showNotification) {
        this.showNotification(channel);
      }
      if (isSuspended) {
        console.log("Suspended", channel.channelSlug);
        continue;
      }
      const shouldAutoOpen = await this.shouldAutoOpenChannel(channel);
      if (shouldAutoOpen) {
        await this.browserApi.openTab(this.makeChannelUrl(channel));
        await this.browserApi.playSound(SoundType.NEW_LIVE_MAIN);
      } else if (showNotification) {
        await this.browserApi.playSound(SoundType.NEW_LIVE_SUB);
      }
      openedAnyPrograms = true;
    }

    this.liveChannelSlugs = new Set(channels.filter((c) => c.isLive).map((c) => c.channelSlug));
  }

  private logChannel(message: string, channel: KickChannel): void {
    console.log(message, channel.channelSlug, channel.userUsername, channel.sessionTitle);
  }

  private showNotification(channel: KickChannel): void {
    this.browserApi.showNotification(
      `${channel.userUsername} started streaming`,
      channel.sessionTitle ?? "-",
      (notificationId) => {
        console.log(`Background checkAndPlaySounds: notificationId: ${notificationId}`);
        this.notifiedLives[notificationId] = this.makeChannelUrl(channel);
      },
    );
  }

  private makeChannelUrl(channel: KickChannel): string {
    return `https://kick.com/${channel.channelSlug}`;
  }

  private async shouldAutoOpenChannel(channel: KickChannel): Promise<boolean> {
    const isTargetUser = await this.browserApi.isAutoOpenChannel(channel.channelSlug);
    const isDuplicateTabGuard = await this.browserApi.isDuplicateTabGuard();
    const isAlreadyOpened = (await this.getChannelSlugsInTabs()).includes(channel.channelSlug);
    const shouldOpen = isTargetUser && (!isDuplicateTabGuard || !isAlreadyOpened);
    console.log(
      `shouldAutoOpen: channelSlug:(${channel.channelSlug}) userUsername:(${channel.userUsername}) sessionTitle:(${channel.sessionTitle}) isTargetUser:(${isTargetUser}) isDuplicateTabGuard:(${isDuplicateTabGuard}) isAlreadyOpened:(${isAlreadyOpened}) shouldOpen:(${shouldOpen})`,
    );
    return shouldOpen;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async getChannelSlugsInTabs(): Promise<string[]> {
    return (await this.browserApi.getTabUrls())
      .map((url) => {
        // Matches 1. but not 2.
        // 1. https://kick.com/chippoiwatashi
        // 2. https://kick.com/chippoiwatashi/schedule
        const match = url.match(/^https:\/\/kick\.com\/([^/]+)\/?$/);
        if (match === null) {
          return undefined;
        }
        return match[1];
      })
      .filter((id): id is string => id !== undefined);
  }
}
