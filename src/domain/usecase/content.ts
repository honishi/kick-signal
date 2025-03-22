import { inject, injectable } from "tsyringe";

import { InjectTokens } from "../../di/inject-tokens";
import { BrowserApi } from "../infra-interface/browser-api";

export interface Content {
  isAutoUnmute(): Promise<boolean>;
  setAutoUnmute(enabled: boolean): Promise<void>;
}

@injectable()
export class ContentImpl implements Content {
  constructor(@inject(InjectTokens.BrowserApi) private browserApi: BrowserApi) {}

  async isAutoUnmute(): Promise<boolean> {
    return await this.browserApi.getAutoUnmute();
  }

  async setAutoUnmute(enabled: boolean): Promise<void> {
    await this.browserApi.setAutoUnmute(enabled);
  }
}
