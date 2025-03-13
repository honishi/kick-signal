import "reflect-metadata";

import { BrowserApi } from "../../../src/domain/infra-interface/browser-api";
import { KickApi } from "../../../src/domain/infra-interface/kick-api";
import { KickChannels } from "../../../src/domain/model/kick-channel";
import { defaultBadgeBackgroundColor, suspendedBadgeBackgroundColor } from "../../../src/domain/usecase/colors";
import { PopupImpl } from "../../../src/domain/usecase/popup";

// Mock the dependencies
jest.mock("../../../src/domain/infra-interface/browser-api");
jest.mock("../../../src/domain/infra-interface/kick-api");

describe("PopupImpl", () => {
  // Mock implementations
  let mockBrowserApi: jest.Mocked<BrowserApi>;
  let mockKickApi: jest.Mocked<KickApi>;
  let popup: PopupImpl;
  
  // Sample data for testing
  const sampleChannels: KickChannels = {
    next: 10,
    channels: [
      {
        isLive: true,
        profilePicture: "https://example.com/profile1.jpg",
        channelSlug: "channel1",
        viewerCount: 100,
        categoryName: "Just Chatting",
        userUsername: "user1",
        sessionTitle: "Stream Title 1"
      },
      {
        isLive: false,
        profilePicture: "https://example.com/profile2.jpg",
        channelSlug: "channel2",
        viewerCount: 0,
        categoryName: "",
        userUsername: "user2",
        sessionTitle: null
      }
    ]
  };

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
      getFollowingChannels: jest.fn().mockResolvedValue(sampleChannels)
    };
    
    // Create the popup instance with mocked dependencies
    popup = new PopupImpl(mockBrowserApi, mockKickApi);
  });

  describe("getFollowingChannels", () => {
    it("should return channels from the KickApi", async () => {
      const offset = 0;
      const result = await popup.getFollowingChannels(offset);
      
      expect(mockKickApi.getFollowingChannels).toHaveBeenCalledWith(offset);
      expect(result).toEqual(sampleChannels);
    });

    it("should pass the correct offset to the API", async () => {
      const offset = 20;
      await popup.getFollowingChannels(offset);
      
      expect(mockKickApi.getFollowingChannels).toHaveBeenCalledWith(offset);
    });
  });

  describe("setBadgeNumber", () => {
    it("should set the badge number via BrowserApi", async () => {
      const badgeNumber = 5;
      await popup.setBadgeNumber(badgeNumber);
      
      expect(mockBrowserApi.setBadgeNumber).toHaveBeenCalledWith(badgeNumber);
    });
  });

  describe("isSuspended", () => {
    it("should return true when suspend date is set", async () => {
      mockBrowserApi.getSuspendFromDate.mockResolvedValue(new Date());
      
      const result = await popup.isSuspended();
      
      expect(result).toBe(true);
      expect(mockBrowserApi.getSuspendFromDate).toHaveBeenCalled();
    });

    it("should return false when suspend date is not set", async () => {
      mockBrowserApi.getSuspendFromDate.mockResolvedValue(undefined);
      
      const result = await popup.isSuspended();
      
      expect(result).toBe(false);
      expect(mockBrowserApi.getSuspendFromDate).toHaveBeenCalled();
    });
  });

  describe("setSuspended", () => {
    it("should set suspend date when suspended is true", async () => {
      // Mock getSuspendFromDate to return a date after setSuspendFromDate is called
      mockBrowserApi.getSuspendFromDate.mockImplementation(() => Promise.resolve(new Date()));
      
      await popup.setSuspended(true);
      
      expect(mockBrowserApi.setSuspendFromDate).toHaveBeenCalledWith(expect.any(Date));
      expect(mockBrowserApi.setBadgeBackgroundColor).toHaveBeenCalledWith(suspendedBadgeBackgroundColor);
    });

    it("should clear suspend date when suspended is false", async () => {
      await popup.setSuspended(false);
      
      expect(mockBrowserApi.setSuspendFromDate).toHaveBeenCalledWith(undefined);
      expect(mockBrowserApi.setBadgeBackgroundColor).toHaveBeenCalledWith(defaultBadgeBackgroundColor);
    });

    it("should set badge background color based on suspension state", async () => {
      // First test with suspended = true
      mockBrowserApi.getSuspendFromDate.mockResolvedValueOnce(new Date());
      await popup.setSuspended(true);
      expect(mockBrowserApi.setBadgeBackgroundColor).toHaveBeenCalledWith(suspendedBadgeBackgroundColor);
      
      // Reset mock
      mockBrowserApi.setBadgeBackgroundColor.mockClear();
      
      // Then test with suspended = false
      mockBrowserApi.getSuspendFromDate.mockResolvedValueOnce(undefined);
      await popup.setSuspended(false);
      expect(mockBrowserApi.setBadgeBackgroundColor).toHaveBeenCalledWith(defaultBadgeBackgroundColor);
    });
  });

  describe("isDuplicateTabGuard", () => {
    it("should return the duplicate tab guard setting from BrowserApi", async () => {
      // Test when duplicate tab guard is enabled
      mockBrowserApi.isDuplicateTabGuard.mockResolvedValueOnce(true);
      let result = await popup.isDuplicateTabGuard();
      expect(result).toBe(true);
      
      // Test when duplicate tab guard is disabled
      mockBrowserApi.isDuplicateTabGuard.mockResolvedValueOnce(false);
      result = await popup.isDuplicateTabGuard();
      expect(result).toBe(false);
    });
  });

  describe("setDuplicateTabGuard", () => {
    it("should set the duplicate tab guard setting via BrowserApi", async () => {
      // Test enabling duplicate tab guard
      await popup.setDuplicateTabGuard(true);
      expect(mockBrowserApi.setDuplicateTabGuard).toHaveBeenCalledWith(true);
      
      // Reset mock
      mockBrowserApi.setDuplicateTabGuard.mockClear();
      
      // Test disabling duplicate tab guard
      await popup.setDuplicateTabGuard(false);
      expect(mockBrowserApi.setDuplicateTabGuard).toHaveBeenCalledWith(false);
    });
  });

  describe("openOptionsPage", () => {
    it("should call openOptionsPage on BrowserApi", () => {
      popup.openOptionsPage();
      
      expect(mockBrowserApi.openOptionsPage).toHaveBeenCalled();
    });
  });

  describe("isAutoOpenUser", () => {
    it("should check if a user is set for auto-open via BrowserApi", async () => {
      const userId = "channel1";
      
      // Test when user is set for auto-open
      mockBrowserApi.isAutoOpenChannel.mockResolvedValueOnce(true);
      let result = await popup.isAutoOpenUser(userId);
      expect(result).toBe(true);
      expect(mockBrowserApi.isAutoOpenChannel).toHaveBeenCalledWith(userId);
      
      // Reset mock
      mockBrowserApi.isAutoOpenChannel.mockClear();
      
      // Test when user is not set for auto-open
      mockBrowserApi.isAutoOpenChannel.mockResolvedValueOnce(false);
      result = await popup.isAutoOpenUser(userId);
      expect(result).toBe(false);
      expect(mockBrowserApi.isAutoOpenChannel).toHaveBeenCalledWith(userId);
    });
  });

  describe("setAutoOpenUser", () => {
    it("should set auto-open for a user via BrowserApi", async () => {
      const userId = "channel1";
      
      // Test enabling auto-open
      await popup.setAutoOpenUser(userId, true);
      expect(mockBrowserApi.setAutoOpenChannel).toHaveBeenCalledWith(userId, true);
      
      // Reset mock
      mockBrowserApi.setAutoOpenChannel.mockClear();
      
      // Test disabling auto-open
      await popup.setAutoOpenUser(userId, false);
      expect(mockBrowserApi.setAutoOpenChannel).toHaveBeenCalledWith(userId, false);
    });
  });
});
