import "reflect-metadata";

import { container } from "tsyringe";

import { InjectTokens } from "../di/inject-tokens";
import { configureDefaultContainer } from "../di/register";
import { Content } from "../domain/usecase/content";

async function listenLoadEvent() {
  unmutePlayerIfMuted();
}

async function unmutePlayerIfMuted() {
  if (!isPlayerPage()) {
    return;
  }

  const content = container.resolve<Content>(InjectTokens.Content);
  const isAutoUnmute = await content.isAutoUnmute();
  if (!isAutoUnmute) {
    return;
  }

  await sleep(2000);
  await unmuteVideoPlayer();
}

function isPlayerPage(): boolean {
  // "https://kick.com/myakkomyako" -> true
  // "https://kick.com/myakkomyako/videos" -> false
  return window.location.pathname.split("/").filter(Boolean).length === 1;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function unmuteVideoPlayer() {
  const videoElem = document.querySelector("video");
  if (!videoElem) {
    return;
  }
  videoElem.muted = false;
  await sleep(200);
  videoElem.volume = 1;
}

configureDefaultContainer();
window.addEventListener("load", listenLoadEvent);
