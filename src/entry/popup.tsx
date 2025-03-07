import "reflect-metadata";
import "../view/css/tailwind.css";

import React from "react";
import { createRoot, Root } from "react-dom/client";
import { container } from "tsyringe";

import { InjectTokens } from "../di/inject-tokens";
import { configureDefaultContainer } from "../di/register";
import { KickChannel } from "../domain/model/kick-channel";
import { Popup } from "../domain/usecase/popup";
import Channel from "./component/Channel";

const SUSPEND_BUTTON_ID = "suspend-button";
const DUPLICATE_TAB_GUARD_BUTTON_ID = "duplicate-tab-guard-button";

const roots: { [key: string]: Root } = {};

async function renderPage() {
  // Render
  await renderMenu();
  await renderTabs();

  // Initial update
  await updateFollowingChannels();
}

async function renderMenu() {
  const popup = container.resolve<Popup>(InjectTokens.Popup);

  // Suspend button
  const suspendButton = document.getElementById(SUSPEND_BUTTON_ID) as HTMLButtonElement;
  suspendButton.onclick = async () => {
    await toggleSuspended();
    await updateSuspendButton();
  };
  const autoLaunchButtonTooltip = chrome.i18n.getMessage("autoLaunchButtonTooltip");
  suspendButton.title = autoLaunchButtonTooltip;
  await updateSuspendButton();

  // Duplicate tab guard button
  const duplicateTabGuardButton = document.getElementById(
    DUPLICATE_TAB_GUARD_BUTTON_ID,
  ) as HTMLButtonElement;
  duplicateTabGuardButton.onclick = async () => {
    await toggleDuplicateTabGuard();
    await updateDuplicateTabGuardButton();
  };
  const duplicateTabGuardButtonTooltip = chrome.i18n.getMessage("duplicateTabGuardButtonTooltip");
  duplicateTabGuardButton.title = duplicateTabGuardButtonTooltip;
  await updateDuplicateTabGuardButton();

  // Refresh button
  const refreshButton = document.getElementById("refresh-button") as HTMLButtonElement;
  refreshButton.onclick = async () => {
    await refreshCurrentTab();
  };
  const refreshText = chrome.i18n.getMessage("refresh");
  refreshButton.textContent = refreshText;
  const refreshButtonTooltip = chrome.i18n.getMessage("refreshButtonTooltip");
  refreshButton.title = refreshButtonTooltip;

  // Option button
  const optionButton = document.getElementById("option-button") as HTMLButtonElement;
  optionButton.onclick = () => {
    popup.openOptionsPage();
  };
  const optionText = chrome.i18n.getMessage("options");
  optionButton.textContent = optionText;
  const optionButtonTooltip = chrome.i18n.getMessage("optionsButtonTooltip");
  optionButton.title = optionButtonTooltip;
}

async function renderTabs() {
  const followingButton = document.getElementById("following-button") as HTMLButtonElement;
  const followingText = chrome.i18n.getMessage("following");
  followingButton.textContent = followingText;

  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const tabName = button.getAttribute("data-tab");
      if (tabName === null) {
        return;
      }

      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      button.classList.add("active");
      const tabContent = document.getElementById(tabName);
      if (tabContent === null) {
        return;
      }
      tabContent.classList.add("active");
    });
  });
}

async function updateFollowingChannels() {
  const channelsContainer = document.getElementById("following-channels-list");
  if (channelsContainer === null) {
    return;
  }
  if (!roots.followingChannels) {
    roots.followingChannels = createRoot(channelsContainer);
  }

  try {
    const popup = container.resolve<Popup>(InjectTokens.Popup);
    roots.followingChannels.render(<LoadingLabel />);
    const channels = await popup.getFollowingChannels();
    // const channels: KickChannel[] = [];
    if (channels.length === 0) {
      roots.followingChannels.render(<NoChannelsLabel />);
    } else {
      roots.followingChannels.render(<ChannelGrid channels={channels} />);
    }
    const liveChannels = channels.filter((channel) => channel.isLive);
    await popup.setBadgeNumber(liveChannels.length);
  } catch (e) {
    console.log(e);
  }
}

function LoadingLabel() {
  const [dots, setDots] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => (prevDots + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const loadingDots = ".".repeat(dots);
  return (
    <div className="m-4 flex w-full items-center gap-2 py-10 text-sm">Loading {loadingDots}</div>
  );
}

function NoChannelsLabel() {
  return (
    <div className="m-4 flex w-full items-center gap-2 py-10 text-sm">
      {chrome.i18n.getMessage("noLiveStreams")}
      <img src={randomNoChannelImage()} width="24" alt="No channels" />
    </div>
  );
}

function randomNoChannelImage() {
  const imageFiles = ["../images/no_stream/resident_sleeper.png"];
  const randomIndex = Math.floor(Math.random() * imageFiles.length);
  return imageFiles[randomIndex];
}

function ChannelGrid({ channels }: { channels: KickChannel[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {channels.map((p) => (
        <Channel channel={p} key={p.channelSlug} />
      ))}
    </div>
  );
}

async function toggleSuspended() {
  const popup = container.resolve<Popup>(InjectTokens.Popup);
  const isSuspended = await popup.isSuspended();
  await popup.setSuspended(!isSuspended);
}

async function updateSuspendButton() {
  const popup = container.resolve<Popup>(InjectTokens.Popup);
  const isSuspended = await popup.isSuspended();
  const suspendIcon = document.getElementById("suspend-icon") as HTMLSpanElement;
  const suspendButton = document.getElementById(SUSPEND_BUTTON_ID) as HTMLButtonElement;
  suspendIcon.textContent = isSuspended ? "sensors_off" : "sensors";
  const autoLaunchText = chrome.i18n.getMessage("autoLaunch");
  suspendButton.textContent = `${autoLaunchText}: ${isSuspended ? "Off" : "On"}`;
}

async function toggleDuplicateTabGuard() {
  const popup = container.resolve<Popup>(InjectTokens.Popup);
  const isDuplicateTabGuard = await popup.isDuplicateTabGuard();
  await popup.setDuplicateTabGuard(!isDuplicateTabGuard);
}

async function updateDuplicateTabGuardButton() {
  const popup = container.resolve<Popup>(InjectTokens.Popup);
  const isDuplicateTabGuard = await popup.isDuplicateTabGuard();
  const duplicateTabGuardIcon = document.getElementById(
    "duplicate-tab-guard-icon",
  ) as HTMLSpanElement;
  const duplicateTabGuardButton = document.getElementById(
    DUPLICATE_TAB_GUARD_BUTTON_ID,
  ) as HTMLButtonElement;
  duplicateTabGuardIcon.textContent = isDuplicateTabGuard ? "verified_user" : "remove_moderator";
  const duplicateTabGuardText = chrome.i18n.getMessage("duplicateTabGuard");
  duplicateTabGuardButton.textContent = `${duplicateTabGuardText}: ${isDuplicateTabGuard ? "On" : "Off"}`;
}

async function refreshCurrentTab() {
  const tabName = document.querySelector(".tab-button.active")?.getAttribute("data-tab");
  if (tabName === null) {
    return;
  }
  if (tabName === "following-channels") {
    await updateFollowingChannels();
  }
}

function addEventListeners() {
  document.addEventListener("DOMContentLoaded", async () => {
    await renderPage();
  });
}

configureDefaultContainer();
addEventListeners();
