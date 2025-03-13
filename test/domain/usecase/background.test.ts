import "reflect-metadata";

import { BrowserApi } from "../../../src/domain/infra-interface/browser-api";
import { KickApi } from "../../../src/domain/infra-interface/kick-api";
import { KickChannel } from "../../../src/domain/model/kick-channel";
import { SoundType } from "../../../src/domain/model/sound-type";
import { BackgroundImpl } from "../../../src/domain/usecase/background";
import { defaultBadgeBackgroundColor } from "../../../src/domain/usecase/colors";

// Mock the dependencies
jest.mock("../../../src/domain/infra-interface/browser-api");
jest.mock("../../../src/domain/infra-interface/kick-api");

describe("BackgroundImpl", () => {
  // Mock implementations
  let mockBrowserApi: jest.Mocked<BrowserApi>;
  let mockKickApi: jest.Mocked<KickApi>;
  let background: BackgroundImpl;
  
  // Sample channel data for testing
  const sampleChannels: KickChannel[] = [
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
  ];

  // Setup before each test
  beforeEach(() => {
    jest.useFakeTimers();
    
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
    
    // Create the background instance with mocked dependencies
    background = new BackgroundImpl(mockBrowserApi, mockKickApi);
    
    // Mock console.log to avoid cluttering test output
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initialize", () => {
    it("should reset suspended state on initialization", async () => {
      // The constructor calls initialize, so we can verify it was called
      expect(mockBrowserApi.setSuspendFromDate).toHaveBeenCalledWith(undefined);
      expect(mockBrowserApi.setBadgeBackgroundColor).toHaveBeenCalledWith(defaultBadgeBackgroundColor);
    });
  });

  describe("run", () => {
    it("should start the background process", async () => {
      await background.run();
      
      expect(mockBrowserApi.startSendingKeepAliveFromOffscreen).toHaveBeenCalled();
      expect(mockKickApi.getLiveChannels).toHaveBeenCalled();
    });

    it("should not start if already running", async () => {
      // Run once
      await background.run();
      
      // Clear mocks to check if they're called again
      mockBrowserApi.startSendingKeepAliveFromOffscreen.mockClear();
      mockKickApi.getLiveChannels.mockClear();
      
      // Run again
      await background.run();
      
      // Should not call these methods again
      expect(mockBrowserApi.startSendingKeepAliveFromOffscreen).not.toHaveBeenCalled();
      expect(mockKickApi.getLiveChannels).not.toHaveBeenCalled();
    });

    it("should set up interval for checking channels", async () => {
      await background.run();
      
      // Clear the initial call
      mockKickApi.getLiveChannels.mockClear();
      
      // Advance timer by the interval (1 minute)
      jest.advanceTimersByTime(60 * 1000);
      
      // Should call getLiveChannels again
      expect(mockKickApi.getLiveChannels).toHaveBeenCalled();
    });
  });

  describe("openNotification", () => {
    it("should open a tab with the correct URL when notification ID exists", async () => {
      const notificationId = "test-notification-id";
      const channelUrl = "https://kick.com/channel1";
      
      // Manually set the notifiedLives property using private property access
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (background as any).notifiedLives[notificationId] = channelUrl;
      
      // Try to open the notification
      await background.openNotification(notificationId);
      
      // Should open the tab with the correct URL
      expect(mockBrowserApi.openTab).toHaveBeenCalledWith(channelUrl);
    });

    it("should not open a tab when notification ID does not exist", async () => {
      await background.openNotification("non-existent-id");
      
      expect(mockBrowserApi.openTab).not.toHaveBeenCalled();
    });
  });

  describe("channel checking", () => {
    it("should update badge number with channel count", async () => {
      mockKickApi.getLiveChannels.mockResolvedValue(sampleChannels);
      
      await background.run();
      
      expect(mockBrowserApi.setBadgeNumber).toHaveBeenCalledWith(sampleChannels.length);
    });

    it("should not show notifications on first check", async () => {
      mockKickApi.getLiveChannels.mockResolvedValue([sampleChannels[0]]);
      
      await background.run();
      
      expect(mockBrowserApi.showNotification).not.toHaveBeenCalled();
      expect(mockBrowserApi.playSound).not.toHaveBeenCalled();
    });

    it("should show notification when a channel becomes live", async () => {
      // First check - initialize with no live channels
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (background as any).lastChannelCheckTime = new Date(); // Set this to simulate a previous check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (background as any).liveChannelSlugs = new Set(); // No channels are live initially
      
      // Set up a channel that becomes live
      const liveChannel = { ...sampleChannels[0], isLive: true };
      mockKickApi.getLiveChannels.mockResolvedValueOnce([liveChannel]);
      
      // Mock the showNotification method to capture the call
      mockBrowserApi.showNotification.mockImplementation((title, message, callback) => {
        callback("test-notification-id");
      });
      
      // Manually call the private method to check channels
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (background as any).checkChannels([liveChannel]);
      
      // Should show notification
      expect(mockBrowserApi.showNotification).toHaveBeenCalledWith(
        `${liveChannel.userUsername} started streaming`,
        liveChannel.sessionTitle || "-",
        expect.any(Function)
      );
      
      // Should play sound
      expect(mockBrowserApi.playSound).toHaveBeenCalledWith(SoundType.NEW_LIVE_SUB);
    });

    it("should auto-open tab when channel becomes live and is in auto-open list", async () => {
      // Configure auto-open for channel1
      mockBrowserApi.isAutoOpenChannel.mockImplementation(
        (slug) => Promise.resolve(slug === "channel1")
      );
      
      // First check - initialize
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (background as any).lastChannelCheckTime = new Date(); // Set this to simulate a previous check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (background as any).liveChannelSlugs = new Set(); // No channels are live initially
      
      // Set up a channel that becomes live
      const liveChannel = { ...sampleChannels[0], isLive: true };
      
      // Manually call the private method to check channels
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (background as any).checkChannels([liveChannel]);
      
      // Should open tab
      expect(mockBrowserApi.openTab).toHaveBeenCalledWith("https://kick.com/channel1");
      
      // Should play main sound
      expect(mockBrowserApi.playSound).toHaveBeenCalledWith(SoundType.NEW_LIVE_MAIN);
    });

    it("should not auto-open tab when suspended", async () => {
      // Configure auto-open for channel1
      mockBrowserApi.isAutoOpenChannel.mockImplementation(
        (slug) => Promise.resolve(slug === "channel1")
      );
      
      // Configure suspended state
      mockBrowserApi.getSuspendFromDate.mockResolvedValue(new Date());
      
      // First check - initialize
      mockKickApi.getLiveChannels.mockResolvedValueOnce([
        { ...sampleChannels[0], isLive: false }
      ]);
      
      await background.run();
      
      // Second check - channel becomes live
      mockKickApi.getLiveChannels.mockResolvedValueOnce([
        { ...sampleChannels[0], isLive: true }
      ]);
      
      // Advance timer to trigger second check
      jest.advanceTimersByTime(60 * 1000);
      
      // Should not open tab
      expect(mockBrowserApi.openTab).not.toHaveBeenCalled();
      
      // Should not play main sound
      expect(mockBrowserApi.playSound).not.toHaveBeenCalledWith(SoundType.NEW_LIVE_MAIN);
    });

    it("should not auto-open tab when duplicate tab guard is enabled and tab is already open", async () => {
      // Configure auto-open for channel1
      mockBrowserApi.isAutoOpenChannel.mockImplementation(
        (slug) => Promise.resolve(slug === "channel1")
      );
      
      // Configure duplicate tab guard
      mockBrowserApi.isDuplicateTabGuard.mockResolvedValue(true);
      
      // Configure tab URLs to include channel1
      mockBrowserApi.getTabUrls.mockResolvedValue(["https://kick.com/channel1"]);
      
      // First check - initialize
      mockKickApi.getLiveChannels.mockResolvedValueOnce([
        { ...sampleChannels[0], isLive: false }
      ]);
      
      await background.run();
      
      // Second check - channel becomes live
      mockKickApi.getLiveChannels.mockResolvedValueOnce([
        { ...sampleChannels[0], isLive: true }
      ]);
      
      // Advance timer to trigger second check
      jest.advanceTimersByTime(60 * 1000);
      
      // Should not open tab
      expect(mockBrowserApi.openTab).not.toHaveBeenCalled();
    });

    it("should handle errors when requesting channels", async () => {
      // Mock getLiveChannels to throw an error
      mockKickApi.getLiveChannels.mockRejectedValueOnce(new Error("API error"));
      
      // Should not throw
      await expect(background.run()).resolves.not.toThrow();
      
      // Advance timer to trigger second check
      jest.advanceTimersByTime(60 * 1000);
      
      // Should try again
      expect(mockKickApi.getLiveChannels).toHaveBeenCalledTimes(2);
    });
  });
});