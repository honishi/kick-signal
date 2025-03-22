import { container } from "tsyringe";

import { BackgroundImpl } from "../domain/usecase/background";
import { ContentImpl } from "../domain/usecase/content";
import { OptionImpl } from "../domain/usecase/option";
import { PopupImpl } from "../domain/usecase/popup";
import { BrowserApiImpl } from "../infra/browser-api";
import { KickApiImpl } from "../infra/kick-api";
import { InjectTokens } from "./inject-tokens";

export function configureDefaultContainer() {
  container.register(InjectTokens.Background, { useClass: BackgroundImpl });
  container.register(InjectTokens.BrowserApi, { useClass: BrowserApiImpl });
  container.register(InjectTokens.Content, { useClass: ContentImpl });
  container.register(InjectTokens.KickApi, { useClass: KickApiImpl });
  container.register(InjectTokens.Option, { useClass: OptionImpl });
  container.register(InjectTokens.Popup, { useClass: PopupImpl });
}
