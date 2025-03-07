import { BrowserApi } from "../domain/infra-interface/browser-api";
import { SoundType } from "../domain/model/sound-type";
import { ChromeMessage, ChromeMessageType } from "./chrome_message/message";

const SHOW_NOTIFICATION_KEY = "showNotification";
const SOUND_VOLUME_KEY = "soundVolume";
const SUSPEND_FROM_DATE_KEY = "suspendFromDate";
const DUPLICATE_TAB_GUARD_KEY = "duplicateTabGuard";
const AUTO_OPEN_CHANNELS_KEY = "autoOpenChannels";
const AUTO_UNMUTE_KEY = "autoUnmute";

const OFFSCREEN_HTML = "html/offscreen.html";

export class BrowserApiImpl implements BrowserApi {
  async startSendingKeepAliveFromOffscreen(): Promise<void> {
    await this.createOffscreen();
  }

  async setWarningBadge(): Promise<void> {
    await chrome.action.setBadgeText({ text: "❗️" });
  }

  async setBadgeNumber(number: number): Promise<void> {
    await chrome.action.setBadgeText({ text: number.toString() });
  }

  async setBadgeBackgroundColor(hex: string): Promise<void> {
    await chrome.action.setBadgeBackgroundColor({ color: hex });
  }

  async getShowNotification(): Promise<boolean> {
    const result = await chrome.storage.local.get([SHOW_NOTIFICATION_KEY]);
    return result[SHOW_NOTIFICATION_KEY] ?? true;
  }

  async setShowNotification(value: boolean): Promise<void> {
    await chrome.storage.local.set({ [SHOW_NOTIFICATION_KEY]: value });
  }

  async getSoundVolume(): Promise<number> {
    const result = await chrome.storage.local.get([SOUND_VOLUME_KEY]);
    return result[SOUND_VOLUME_KEY] ?? 1.0;
  }

  async setSoundVolume(value: number): Promise<void> {
    await chrome.storage.local.set({ [SOUND_VOLUME_KEY]: value });
  }

  async playSound(sound: SoundType): Promise<void> {
    await this.createOffscreen();

    const message: ChromeMessage = {
      messageType: ChromeMessageType.PLAY_SOUND,
      options: {
        sound: sound,
        volume: await this.getSoundVolume(),
      },
    };

    try {
      await chrome.runtime.sendMessage(message);
    } catch (e) {
      console.error(`Failed to send message: ${e}`);
    } finally {
      console.log(`sent message: ${message}`);
    }
  }

  private async createOffscreen(): Promise<void> {
    if (await chrome.offscreen.hasDocument()) {
      return;
    }
    const url = chrome.runtime.getURL(OFFSCREEN_HTML);
    try {
      await chrome.offscreen.createDocument({
        url: url,
        reasons: [chrome.offscreen.Reason.BLOBS, chrome.offscreen.Reason.AUDIO_PLAYBACK],
        justification: "background.js keep alive, audio playback",
      });
    } catch (e) {
      console.error(`Failed to create offscreen document: ${e}`);
    } finally {
      console.log("Offscreen document created");
    }
  }

  public showNotification(
    title: string,
    message: string,
    onCreated: (notificationId: string) => void,
  ): void {
    chrome.notifications.create(
      {
        type: "basic",
        iconUrl: chrome.runtime.getURL("icons/icon128.png"),
        title: title,
        message: message,
      },
      onCreated,
    );
  }

  async isAutoOpenChannel(slug: string): Promise<boolean> {
    const autoOpenChannelSlugs = await this.getAutoOpenChannelSlugs();
    return autoOpenChannelSlugs.includes(slug);
  }

  async getAutoOpenChannelSlugs(): Promise<string[]> {
    const result = await chrome.storage.local.get([AUTO_OPEN_CHANNELS_KEY]);
    const autoOpenChannels = (result[AUTO_OPEN_CHANNELS_KEY] as { [key: string]: string }[]) ?? [];
    return autoOpenChannels.map((channel) => channel.slug);
  }

  async setAutoOpenChannel(slug: string, enabled: boolean): Promise<void> {
    const result = await chrome.storage.local.get([AUTO_OPEN_CHANNELS_KEY]);
    const autoOpenChannels = (result[AUTO_OPEN_CHANNELS_KEY] as { [key: string]: string }[]) ?? [];
    const autoOpenChannelSlugs = autoOpenChannels.map((channel) => channel.slug);
    const targetEnabled = enabled;
    const currentEnabled = autoOpenChannelSlugs.includes(slug);
    if (targetEnabled === currentEnabled) {
      // already set
      return;
    }
    const channels = targetEnabled
      ? [...autoOpenChannels, { slug: slug }]
      : autoOpenChannels.filter((channel) => channel.slug !== slug);
    await chrome.storage.local.set({ [AUTO_OPEN_CHANNELS_KEY]: channels });
  }

  async openTab(url: string): Promise<void> {
    await chrome.tabs.create({ url: url });
  }

  async getTabUrls(): Promise<string[]> {
    const tabs = await chrome.tabs.query({});
    return tabs.map((tab) => tab.url).filter((url): url is string => url !== undefined);
  }

  async setSuspendFromDate(date: Date | undefined): Promise<void> {
    if (date === undefined) {
      await chrome.storage.local.remove(SUSPEND_FROM_DATE_KEY);
      return;
    }
    await chrome.storage.local.set({ [SUSPEND_FROM_DATE_KEY]: date.toISOString() });
  }

  async getSuspendFromDate(): Promise<Date | undefined> {
    const result = await chrome.storage.local.get([SUSPEND_FROM_DATE_KEY]);
    const date = result[SUSPEND_FROM_DATE_KEY];
    if (date === undefined) {
      return undefined;
    }
    return new Date(date);
  }

  async isDuplicateTabGuard(): Promise<boolean> {
    const result = await chrome.storage.local.get([DUPLICATE_TAB_GUARD_KEY]);
    return result[DUPLICATE_TAB_GUARD_KEY] ?? true;
  }

  async setDuplicateTabGuard(duplicateTabGuard: boolean): Promise<void> {
    await chrome.storage.local.set({ [DUPLICATE_TAB_GUARD_KEY]: duplicateTabGuard });
  }

  openOptionsPage(): void {
    chrome.runtime.openOptionsPage();
  }

  async getAutoUnmute(): Promise<boolean> {
    const result = await chrome.storage.local.get([AUTO_UNMUTE_KEY]);
    return result[AUTO_UNMUTE_KEY] ?? false;
  }

  async setAutoUnmute(enabled: boolean): Promise<void> {
    await chrome.storage.local.set({ [AUTO_UNMUTE_KEY]: enabled });
  }
}
