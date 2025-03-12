import "reflect-metadata";
import "../view/css/tailwind.css";

import React from "react";
import { createRoot, Root } from "react-dom/client";
import { container } from "tsyringe";

import { InjectTokens } from "../di/inject-tokens";
import { configureDefaultContainer } from "../di/register";
import { Popup } from "../domain/usecase/popup";
import { FollowingChannels } from "./component/FollowingChannels";

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
  roots.followingChannels.render(<FollowingChannels refreshDate={new Date()} />);
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
