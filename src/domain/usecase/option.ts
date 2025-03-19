import { inject, injectable } from "tsyringe";

import { InjectTokens } from "../../di/inject-tokens";
import { BrowserApi } from "../infra-interface/browser-api";
import { KickApi } from "../infra-interface/kick-api";
import { SoundType } from "../model/sound-type";

export interface Option {
  getResetSuspendOnRestart(): Promise<boolean>;
  setResetSuspendOnRestart(value: boolean): Promise<void>;
  getAutoUnmute(): Promise<boolean>;
  setAutoUnmute(value: boolean): Promise<void>;
  getShowNotification(): Promise<boolean>;
  setShowNotification(value: boolean): Promise<void>;
  getSoundVolume(): Promise<number>;
  setSoundVolume(value: number): Promise<void>;
  playTestSound(): Promise<void>;
}

@injectable()
export class OptionImpl implements Option {
  constructor(
    @inject(InjectTokens.BrowserApi) private browserApi: BrowserApi,
    @inject(InjectTokens.KickApi) private kickApi: KickApi,
  ) {}

  async getResetSuspendOnRestart(): Promise<boolean> {
    return await this.browserApi.getResetSuspendOnRestart();
  }

  async setResetSuspendOnRestart(value: boolean): Promise<void> {
    await this.browserApi.setResetSuspendOnRestart(value);
  }

  async getAutoUnmute(): Promise<boolean> {
    return await this.browserApi.getAutoUnmute();
  }

  async setAutoUnmute(value: boolean): Promise<void> {
    await this.browserApi.setAutoUnmute(value);
  }

  async getShowNotification(): Promise<boolean> {
    return await this.browserApi.getShowNotification();
  }

  async setShowNotification(value: boolean): Promise<void> {
    await this.browserApi.setShowNotification(value);
  }

  async getSoundVolume(): Promise<number> {
    return await this.browserApi.getSoundVolume();
  }

  async setSoundVolume(value: number): Promise<void> {
    await this.browserApi.setSoundVolume(value);
  }

  async playTestSound(): Promise<void> {
    await this.browserApi.playSound(SoundType.NEW_LIVE_MAIN);
  }
}
