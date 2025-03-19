import { SoundType } from "../model/sound-type";

export interface BrowserApi {
  startSendingKeepAliveFromOffscreen(): Promise<void>;
  setWarningBadge(): Promise<void>;
  setBadgeNumber(number: number): Promise<void>;
  setBadgeBackgroundColor(hex: string): Promise<void>;
  getShowNotification(): Promise<boolean>;
  setShowNotification(value: boolean): Promise<void>;
  getSoundVolume(): Promise<number>;
  setSoundVolume(value: number): Promise<void>;
  playSound(sound: SoundType): Promise<void>;
  showNotification(
    title: string,
    message: string,
    onCreated: (notificationId: string) => void,
  ): void;
  isAutoOpenChannel(slug: string): Promise<boolean>;
  getAutoOpenChannelSlugs(): Promise<string[]>;
  setAutoOpenChannel(slug: string, enabled: boolean): Promise<void>;
  openTab(url: string): Promise<void>;
  getTabUrls(): Promise<string[]>;
  setSuspendFromDate(date: Date | undefined): Promise<void>;
  getSuspendFromDate(): Promise<Date | undefined>;
  getResetSuspendOnRestart(): Promise<boolean>;
  setResetSuspendOnRestart(enabled: boolean): Promise<void>;
  isDuplicateTabGuard(): Promise<boolean>;
  setDuplicateTabGuard(duplicateTabGuard: boolean): Promise<void>;
  openOptionsPage(): void;
  getAutoUnmute(): Promise<boolean>;
  setAutoUnmute(enabled: boolean): Promise<void>;
}
