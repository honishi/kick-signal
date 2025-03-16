import React, { useEffect, useState } from "react";
import Switch from "react-switch";
import { container } from "tsyringe";

import { InjectTokens } from "../../di/inject-tokens";
import { KickChannel } from "../../domain/model/kick-channel";
import { Popup } from "../../domain/usecase/popup";

const gridItemWidth = 240;

export default function Channel(props: { channel: KickChannel }) {
  const popup = container.resolve<Popup>(InjectTokens.Popup);

  const onClick = async function () {
    console.log("onclick");
    await chrome.tabs.create({ active: true, url: makeLiveUrl(props.channel) });
  };
  const [isChecked, setIsChecked] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    async function fetchIsAutoOpen() {
      const isAutoOpen = await popup.isAutoOpenUser(props.channel.channelSlug);
      setIsChecked(isAutoOpen);
    }
    fetchIsAutoOpen();
  }, [props.channel.channelSlug]);

  async function handleChange(checked: boolean) {
    setIsChecked(checked);
    await popup.setAutoOpenUser(props.channel.channelSlug, checked);
  }

  if (isChecked === undefined) {
    return <div className="h-16" />;
  }

  return (
    <div className="flex h-16 items-center justify-between pr-8">
      <a href="" onClick={onClick} className="block w-full transition-transform hover:scale-[1.03]">
        {/* Channel info */}
        <div
          className="flex items-center overflow-hidden"
          style={{ maxWidth: `${gridItemWidth}px` }}
        >
          <div className="flex-1">
            <ProfileImage
              imageUrl={props.channel.profilePicture ?? undefined}
              isLive={props.channel.isLive}
            />
          </div>
          {/* Channel text */}
          <div className="ml-4 flex w-full flex-col">
            <Title title={props.channel.sessionTitle ?? ""} />
            <UserName
              userName={props.channel.userUsername}
              isLive={props.channel.isLive}
              viewerCount={props.channel.viewerCount}
            />
          </div>
        </div>
      </a>
      <Switch
        checked={isChecked}
        onChange={handleChange}
        onColor="#a0a0a0"
        onHandleColor="#6ad33e"
        handleDiameter={20}
        uncheckedIcon={false}
        checkedIcon={false}
        boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
        activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
        height={14}
        width={32}
      />
    </div>
  );
}

function ProfileImage(props: { imageUrl?: string; isLive: boolean }) {
  const url = props.imageUrl ?? "../images/default-profile-pictures/default.jpeg";
  return (
    <div className="h-10 w-10">
      <img
        src={url}
        alt={url}
        className={`h-full w-full rounded-full object-cover ${props.isLive ? "border-kick-green-for-light dark:border-kick-green-for-dark border-2" : "opacity-50 grayscale"}`}
      />
    </div>
  );
}

function Title(props: { title: string }) {
  return (
    <div className="line-clamp-1 overflow-hidden text-sm break-words text-ellipsis">
      {props.title}
    </div>
  );
}

function UserName(props: { userName: string; isLive: boolean; viewerCount: number }) {
  return (
    <div
      className={`flex items-center text-sm ${props.isLive ? "" : "text-opacity-80 text-gray-500"}`}
    >
      <span className="mr-1 flex-1">{props.userName}</span>
      {props.isLive && (
        <div className="mr-2 flex items-center">
          <div className="bg-kick-green-for-light dark:bg-kick-green-for-dark mr-1 h-2 w-2 rounded-full"></div>
          <span className="text-xs text-gray-500">{props.viewerCount.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

function makeLiveUrl(channel: KickChannel) {
  return `https://kick.com/${channel.channelSlug}`;
}
