import "reflect-metadata";

import { BrowserApi } from "../../../src/domain/infra-interface/browser-api";
import { KickApi } from "../../../src/domain/infra-interface/kick-api";
import { SoundType } from "../../../src/domain/model/sound-type";
import { OptionImpl } from "../../../src/domain/usecase/option";

// Mock the dependencies
jest.mock("../../../src/domain/infra-interface/browser-api");
jest.mock("../../../src/domain/infra-interface/kick-api");

describe("OptionImpl", () => {
  // Mock implementations
  let mockBrowserApi: jest.Mocked<BrowserApi>;
  let mockKickApi: jest.Mocked<KickApi>;
  let option: OptionImpl;

  // Setup before each test
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock implementations
    mockBrowserApi = {
      startSendingKeepAliveFromOffscreen: jest.fn().mockResolvedValue(undefined),
      setWarningBadge: jest.fn().mockResolvedValue(undefined),
      setBadgeNumber: jest.fn().mockResolvedValue(undefined),
      setBadgeBackgroundColor: jest.fn().mockResolvedValue(undefined),
      getShowNotification: jest.fn().mockResolvedValue(true),
      setShowNotification: jest.fn().mockResolvedValue(undefined),
      getSoundVolume: jest.fn().mockResolvedValue(50),
      setSoundVolume: jest.fn().mockResolvedValue(undefined),
      playSound: jest.fn().mockResolvedValue(undefined),
      showNotification: jest.fn(),
      isAutoOpenChannel: jest.fn().mockResolvedValue(false),
      getAutoOpenChannelSlugs: jest.fn().mockResolvedValue([]),
      setAutoOpenChannel: jest.fn().mockResolvedValue(undefined),
      openTab: jest.fn().mockResolvedValue(undefined),
      getTabUrls: jest.fn().mockResolvedValue([]),
      setSuspendFromDate: jest.fn().mockResolvedValue(undefined),
      getSuspendFromDate: jest.fn().mockResolvedValue(undefined),
      isDuplicateTabGuard: jest.fn().mockResolvedValue(false),
      setDuplicateTabGuard: jest.fn().mockResolvedValue(undefined),
      openOptionsPage: jest.fn(),
      getAutoUnmute: jest.fn().mockResolvedValue(false),
      setAutoUnmute: jest.fn().mockResolvedValue(undefined)
    };
    
    mockKickApi = {
      getLiveChannels: jest.fn().mockResolvedValue([]),
      getFollowingChannels: jest.fn().mockResolvedValue({ next: null, channels: [] })
    };
    
    // Create the option instance with mocked dependencies
    option = new OptionImpl(mockBrowserApi, mockKickApi);
  });

  describe("getAutoUnmute", () => {
    it("should return auto unmute setting from BrowserApi", async () => {
      // Test when auto unmute is enabled
      mockBrowserApi.getAutoUnmute.mockResolvedValueOnce(true);
      let result = await option.getAutoUnmute();
      expect(result).toBe(true);
      expect(mockBrowserApi.getAutoUnmute).toHaveBeenCalled();
      
      // Test when auto unmute is disabled
      mockBrowserApi.getAutoUnmute.mockResolvedValueOnce(false);
      result = await option.getAutoUnmute();
      expect(result).toBe(false);
      expect(mockBrowserApi.getAutoUnmute).toHaveBeenCalled();
    });
  });

  describe("setAutoUnmute", () => {
    it("should set auto unmute setting via BrowserApi", async () => {
      // Test enabling auto unmute
      await option.setAutoUnmute(true);
      expect(mockBrowserApi.setAutoUnmute).toHaveBeenCalledWith(true);
      
      // Reset mock
      mockBrowserApi.setAutoUnmute.mockClear();
      
      // Test disabling auto unmute
      await option.setAutoUnmute(false);
      expect(mockBrowserApi.setAutoUnmute).toHaveBeenCalledWith(false);
    });
  });

  describe("getShowNotification", () => {
    it("should return show notification setting from BrowserApi", async () => {
      // Test when show notification is enabled
      mockBrowserApi.getShowNotification.mockResolvedValueOnce(true);
      let result = await option.getShowNotification();
      expect(result).toBe(true);
      expect(mockBrowserApi.getShowNotification).toHaveBeenCalled();
      
      // Test when show notification is disabled
      mockBrowserApi.getShowNotification.mockResolvedValueOnce(false);
      result = await option.getShowNotification();
      expect(result).toBe(false);
      expect(mockBrowserApi.getShowNotification).toHaveBeenCalled();
    });
  });

  describe("setShowNotification", () => {
    it("should set show notification setting via BrowserApi", async () => {
      // Test enabling show notification
      await option.setShowNotification(true);
      expect(mockBrowserApi.setShowNotification).toHaveBeenCalledWith(true);
      
      // Reset mock
      mockBrowserApi.setShowNotification.mockClear();
      
      // Test disabling show notification
      await option.setShowNotification(false);
      expect(mockBrowserApi.setShowNotification).toHaveBeenCalledWith(false);
    });
  });

  describe("getSoundVolume", () => {
    it("should return sound volume setting from BrowserApi", async () => {
      // Test with volume 50
      mockBrowserApi.getSoundVolume.mockResolvedValueOnce(50);
      let result = await option.getSoundVolume();
      expect(result).toBe(50);
      expect(mockBrowserApi.getSoundVolume).toHaveBeenCalled();
      
      // Test with volume 75
      mockBrowserApi.getSoundVolume.mockResolvedValueOnce(75);
      result = await option.getSoundVolume();
      expect(result).toBe(75);
      expect(mockBrowserApi.getSoundVolume).toHaveBeenCalled();
    });
  });

  describe("setSoundVolume", () => {
    it("should set sound volume setting via BrowserApi", async () => {
      // Test setting volume to 25
      await option.setSoundVolume(25);
      expect(mockBrowserApi.setSoundVolume).toHaveBeenCalledWith(25);
      
      // Reset mock
      mockBrowserApi.setSoundVolume.mockClear();
      
      // Test setting volume to 100
      await option.setSoundVolume(100);
      expect(mockBrowserApi.setSoundVolume).toHaveBeenCalledWith(100);
    });
  });

  describe("playTestSound", () => {
    it("should play test sound via BrowserApi", async () => {
      await option.playTestSound();
      
      expect(mockBrowserApi.playSound).toHaveBeenCalledWith(SoundType.NEW_LIVE_MAIN);
    });
  });
}); 