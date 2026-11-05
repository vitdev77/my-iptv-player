"use client";
import { useEffect, useRef, useState } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";

interface VideoPlayerProps {
  src: string | null | undefined;
  name: string;
}

export function VideoPlayer({ src, name }: VideoPlayerProps) {
  const artRef = useRef<HTMLDivElement>(null);
  const htmlVideoRef = useRef<HTMLVideoElement>(null);
  const instanceRef = useRef<Artplayer | null>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);
  const [playerMode, setPlayerMode] = useState<"artplayer" | "html5">(
    "artplayer",
  );

  useEffect(() => {
    if (playerMode !== "artplayer") return;
    const container = artRef.current;
    if (!container || !src) return;

    const art = new Artplayer({
      container: container,
      url: src,
      type: "m3u8",
      customType: {
        m3u8: function (video, url) {
          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = url;
          } else if (Hls.isSupported()) {
            const hls = new Hls({
              maxBufferLength: 4,
              maxMaxBufferLength: 6,
              liveSyncDurationCount: 2,
              liveMaxLatencyDurationCount: 3,
              enableWorker: true,
              backBufferLength: 0,
            });
            hls.loadSource(url);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, function () {
              if (hls.levels.length <= 1) return;
              const qualitySelectors = hls.levels.map((level, index) => {
                return {
                  html: level.height
                    ? `${level.height}p`
                    : `Поток ${index + 1}`,
                  index: index,
                };
              });
              qualitySelectors.unshift({ html: "Авто", index: -1 });

              art.setting.update({
                name: "quality",
                type: "selector",
                html: "Качество",
                selector: qualitySelectors,
                onSelect: function (item: any) {
                  hls.currentLevel = item.index;
                  return item.html;
                },
              });
            });

            hls.on(Hls.Events.ERROR, function (event, data) {
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log(
                      "Сбой сети, пробуем восстановить соединение...",
                    );
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log("Ошибка медиа-буфера, пробуем восстановить...");
                    hls.recoverMediaError();
                    break;
                  default:
                    console.log("Неисправимая ошибка, перезапускаем плеер...");
                    art.switchUrl(url);
                    break;
                }
              }
            });

            art.on("destroy", () => hls.destroy());
          }
        },
      },
      autoplay: true,
      isLive: true,
      setting: true,
      settings: [
        {
          name: "quality",
          type: "selector",
          html: "Качество",
          selector: [{ html: "Авто", index: -1 }],
        },
      ],
      volume: 0.7,
      fullscreen: true,
      pip: true,
      theme: "#3b82f6",
    });

    instanceRef.current = art;

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy(false);
        instanceRef.current = null;
      }
    };
  }, [src, playerMode]);
  useEffect(() => {
    if (playerMode !== "html5") return;
    const video = htmlVideoRef.current;
    if (!video || !src) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.play().catch((err) => console.log("Автозапуск заблокирован:", err));
    } else if (Hls.isSupported()) {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
      }
      const hls = new Hls({
        backBufferLength: 0,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsInstanceRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video
          .play()
          .catch((err) => console.log("Автозапуск заблокирован:", err));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          }
        }
      });
    }

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [src, playerMode]);

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {src && (
        <div className="flex justify-end gap-1 p-1 bg-muted rounded-lg text-xs w-fit self-end">
          <button
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              playerMode === "artplayer"
                ? "bg-background shadow-sm font-medium"
                : "text-muted-foreground"
            }`}
            onClick={() => setPlayerMode("artplayer")}
          >
            Artplayer
          </button>
          <button
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              playerMode === "html5"
                ? "bg-background shadow-sm font-medium"
                : "text-muted-foreground"
            }`}
            onClick={() => setPlayerMode("html5")}
          >
            Нативный HTML5
          </button>
        </div>
      )}

      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-border flex items-center justify-center">
        {src ? (
          playerMode === "artplayer" ? (
            <div ref={artRef} className="w-full h-full" />
          ) : (
            <video
              ref={htmlVideoRef}
              controls
              className="w-full h-full object-contain"
            />
          )
        ) : (
          <p className="text-muted-foreground">
            Выберите канал для начала воспроизведения
          </p>
        )}
      </div>

      {name && src && (
        <div className="px-1">
          <h2 className="text-xl font-bold tracking-tight">{name}</h2>
          <p className="text-sm text-muted-foreground">
            Движок:{" "}
            {playerMode === "artplayer"
              ? "Artplayer (Low-Latency)"
              : "Стандартный HTML5"}
          </p>
        </div>
      )}
    </div>
  );
}
