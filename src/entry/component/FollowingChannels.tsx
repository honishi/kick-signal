import React, { useEffect, useState } from "react";
import { container } from "tsyringe";

import { InjectTokens } from "../../di/inject-tokens";
import { KickChannel } from "../../domain/model/kick-channel";
import { Popup } from "../../domain/usecase/popup";
import Channel from "./Channel";

export function FollowingChannels(props: { refreshDate: Date }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [channels, setChannels] = useState<KickChannel[]>([]);

  useEffect(() => {
    const fetchChannels = async () => {
      setChannels([]);
      setLoading(true);
      setError(false);
      try {
        const popup = container.resolve<Popup>(InjectTokens.Popup);
        let offset: number | null = 0;
        const MAX_PAGES = 100;
        let page = 0;
        do {
          const channels = await popup.getFollowingChannels(offset);
          setChannels((prevChannels) => [...prevChannels, ...channels.channels]);
          offset = channels.next;
          page++;
        } while (offset && page < MAX_PAGES);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, [props.refreshDate]);

  if (error) {
    return <ErrorLabel />;
  }

  if (!loading && channels.length === 0) {
    return <NoChannelsLabel />;
  }

  return (
    <>
      {channels.length > 0 && <ChannelGrid channels={channels} />}
      {loading && <LoadingLabel />}
    </>
  );
}

function LoadingLabel() {
  const [dots, setDots] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => (prevDots + 1) % 7);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const loadingDots = ".".repeat(dots);
  return (
    <div className="m-4 flex w-full items-center gap-2 py-2 text-sm">Loading {loadingDots}</div>
  );
}

function ErrorLabel() {
  return (
    <div className="m-4 flex w-full items-center gap-2 py-10 text-sm">
      {chrome.i18n.getMessage("fetchError")}
    </div>
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
        <Channel channel={p} key={p.channelSlug} className={p.isLive ? "mb-2" : ""} />
      ))}
    </div>
  );
}
