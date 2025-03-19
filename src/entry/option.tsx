import "reflect-metadata";
import "../view/css/tailwind.css";

import { container } from "tsyringe";

import { InjectTokens } from "../di/inject-tokens";
import { configureDefaultContainer } from "../di/register";
import { Option } from "../domain/usecase/option";

async function renderPage() {
  await renderAutoLaunchSettingsTitle();
  await renderResetSuspendOnRestartCheckbox();
  // await renderAutoUnmuteCheckbox();
  await renderNotificationSettingsTitle();
  await renderShowNotificationCheckbox();
  await renderSoundVolume();
}

async function renderAutoLaunchSettingsTitle() {
  const autoLaunchSettingsSpan = document.getElementById(
    "auto-launch-settings-span",
  ) as HTMLSpanElement;
  const autoLaunchSettingsText = chrome.i18n.getMessage("autoLaunchSettings");
  autoLaunchSettingsSpan.textContent = autoLaunchSettingsText;
}

async function renderResetSuspendOnRestartCheckbox() {
  const resetSuspendOnRestartCheckbox = document.getElementById(
    "reset-suspend-on-restart-checkbox",
  ) as HTMLInputElement;
  resetSuspendOnRestartCheckbox.checked = await getResetSuspendOnRestart();
  resetSuspendOnRestartCheckbox.addEventListener("change", async () => {
    const checked = resetSuspendOnRestartCheckbox.checked;
    await setResetSuspendOnRestart(checked);
  });
  const resetSuspendOnRestartLabel = document.getElementById(
    "reset-suspend-on-restart-label",
  ) as HTMLLabelElement;
  const resetSuspendOnRestartCheckboxText = chrome.i18n.getMessage(
    "resetSuspendOnRestartCheckbox",
  );
  resetSuspendOnRestartLabel.textContent = resetSuspendOnRestartCheckboxText;
}

async function getResetSuspendOnRestart(): Promise<boolean> {
  const option = container.resolve<Option>(InjectTokens.Option);
  return await option.getResetSuspendOnRestart();
}

async function setResetSuspendOnRestart(value: boolean): Promise<void> {
  const option = container.resolve<Option>(InjectTokens.Option);
  await option.setResetSuspendOnRestart(value);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function renderAutoUnmuteCheckbox() {
  const autoUnmuteCheckbox = document.getElementById("auto-unmute-checkbox") as HTMLInputElement;
  autoUnmuteCheckbox.checked = await getAutoUnmute();
  autoUnmuteCheckbox.addEventListener("change", async () => {
    const checked = autoUnmuteCheckbox.checked;
    await setAutoUnmute(checked);
  });
  const autoUnmuteLabel = document.getElementById("auto-unmute-label") as HTMLLabelElement;
  const autoUnmuteCheckboxText = chrome.i18n.getMessage("autoUnmuteCheckbox");
  autoUnmuteLabel.textContent = autoUnmuteCheckboxText;
}

async function getAutoUnmute(): Promise<boolean> {
  const option = container.resolve<Option>(InjectTokens.Option);
  return await option.getAutoUnmute();
}

async function setAutoUnmute(value: boolean): Promise<void> {
  const option = container.resolve<Option>(InjectTokens.Option);
  await option.setAutoUnmute(value);
}

async function renderNotificationSettingsTitle() {
  const notificationSettingsSpan = document.getElementById(
    "notification-settings-span",
  ) as HTMLSpanElement;
  const notificationSettingsText = chrome.i18n.getMessage("notificationSettings");
  notificationSettingsSpan.textContent = notificationSettingsText;
}

async function renderShowNotificationCheckbox() {
  const showNotificationCheckbox = document.getElementById(
    "show-notification-checkbox",
  ) as HTMLInputElement;
  showNotificationCheckbox.checked = await getShowNotification();
  showNotificationCheckbox.addEventListener("change", async () => {
    const checked = showNotificationCheckbox.checked;
    await setShowNotification(checked);
  });
  const showNotificationLabel = document.getElementById(
    "show-notification-label",
  ) as HTMLLabelElement;
  const showNotificationCheckboxText = chrome.i18n.getMessage("showNotificationCheckbox");
  showNotificationLabel.textContent = showNotificationCheckboxText;
}

async function getShowNotification(): Promise<boolean> {
  const option = container.resolve<Option>(InjectTokens.Option);
  return await option.getShowNotification();
}

async function setShowNotification(value: boolean): Promise<void> {
  const option = container.resolve<Option>(InjectTokens.Option);
  await option.setShowNotification(value);
}

async function renderSoundVolume() {
  const volumeValue = await getSoundVolumeAsPercentInt();

  const volumeSlider = document.getElementById("volume-slider") as HTMLInputElement;
  volumeSlider.value = volumeValue.toString();
  volumeSlider.addEventListener("input", async () => {
    const value = parseInt(volumeSlider.value);
    await setSoundVolumeAsPercentInt(value);
    await updateVolumeValueText();
  });
  volumeSlider.addEventListener("change", playTestSound);

  const volumeLabel = document.getElementById("volume-label") as HTMLSpanElement;
  const soundVolumeText = chrome.i18n.getMessage("notificationSoundVolume");
  volumeLabel.textContent = soundVolumeText;

  await updateVolumeValueText();

  const playTestSoundButton = document.getElementById(
    "play-test-sound-button",
  ) as HTMLButtonElement;
  playTestSoundButton.addEventListener("click", playTestSound);
  const testSoundVolumeText = chrome.i18n.getMessage("testSoundVolume");
  playTestSoundButton.textContent = testSoundVolumeText;
}

async function updateVolumeValueText() {
  const volumeValue = await getSoundVolumeAsPercentInt();
  const volumeValueText = document.getElementById("volume-value-text") as HTMLSpanElement;
  volumeValueText.textContent = volumeValue.toString();
}

async function getSoundVolumeAsPercentInt(): Promise<number> {
  const option = container.resolve<Option>(InjectTokens.Option);
  const volumeValue = await option.getSoundVolume();
  return Math.round(volumeValue * 100);
}

async function setSoundVolumeAsPercentInt(value: number): Promise<void> {
  const option = container.resolve<Option>(InjectTokens.Option);
  await option.setSoundVolume(value / 100);
}

async function playTestSound() {
  const option = container.resolve<Option>(InjectTokens.Option);
  await option.playTestSound();
}

function addEventListeners() {
  document.addEventListener("DOMContentLoaded", async () => {
    await renderPage();
  });
}

configureDefaultContainer();
addEventListeners();
