"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/videoPlayer";
import { UploadDialog } from "@/components/uploadDialog";
import {
  Tv,
  Tv2,
  Search,
  Loader2,
  Folder,
  ArrowLeft,
  Star,
} from "lucide-react";

interface Channel {
  id: string;
  name: string;
  group: string;
  logo: string;
  url: string;
  isFavorite: boolean;
}

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [viewMode, setViewMode] = useState<"categories" | "all" | "favorites">(
    "categories",
  );

  const [visibleChannelsCount, setVisibleChannelsCount] = useState(50);
  const [visibleGroupsCount, setVisibleGroupsCount] = useState(50);

  const channelsTriggerRef = useRef<HTMLDivElement>(null);
  const groupsTriggerRef = useRef<HTMLDivElement>(null);

  const loadChannels = async (selectLast = false) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/channels");
      if (response.ok) {
        const fetchedChannels = await response.json();
        setChannels(fetchedChannels || []);
        if (selectLast && fetchedChannels && fetchedChannels.length > 0) {
          const lastChannelId = localStorage.getItem(
            "neon_iptv_last_channel_id",
          );
          if (lastChannelId) {
            const last = fetchedChannels.find(
              (c: Channel) => String(c.id) === String(lastChannelId),
            );
            if (last) setActiveChannel(last);
          }
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChannels(true);
  }, []);

  useEffect(() => {
    setVisibleChannelsCount(50);
    setVisibleGroupsCount(50);
  }, [searchQuery, selectedGroup, viewMode]);

  const handleChannelSelect = (channel: Channel) => {
    setActiveChannel(channel);
    localStorage.setItem("neon_iptv_last_channel_id", String(channel.id));
  };

  const toggleFavorite = async (e: React.MouseEvent, channel: Channel) => {
    e.stopPropagation();
    const nextState = !channel.isFavorite;
    setChannels((prev) =>
      prev.map((c) =>
        c.id === channel.id ? { ...c, isFavorite: nextState } : c,
      ),
    );
    if (activeChannel?.id === channel.id) {
      setActiveChannel((prev) =>
        prev ? { ...prev, isFavorite: nextState } : null,
      );
    }
    try {
      await fetch("/api/channels/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: channel.id, isFavorite: nextState }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const favoriteChannels = useMemo(
    () => channels.filter((c) => c.isFavorite),
    [channels],
  );

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const source = viewMode === "favorites" ? favoriteChannels : channels;
    source.forEach((c) => {
      const g = c.group || "Общие";
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [channels, favoriteChannels, viewMode]);

  const groups = useMemo(() => {
    return Object.keys(groupCounts).sort((a, b) => a.localeCompare(b));
  }, [groupCounts]);

  const filteredChannels = useMemo(() => {
    const source = viewMode === "favorites" ? favoriteChannels : channels;
    return source.filter((channel) => {
      const groupName = channel.group || "Общие";
      const matchesGroup = selectedGroup ? groupName === selectedGroup : true;
      const matchesSearch = channel.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [channels, favoriteChannels, selectedGroup, searchQuery, viewMode]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) =>
      g.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [groups, searchQuery]);

  const displayedChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleChannelsCount);
  }, [filteredChannels, visibleChannelsCount]);

  const displayedGroups = useMemo(() => {
    return filteredGroups.slice(0, visibleGroupsCount);
  }, [filteredGroups, visibleGroupsCount]);

  useEffect(() => {
    if (isLoading) return;
    const trigger = channelsTriggerRef.current;
    if (!trigger) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          visibleChannelsCount < filteredChannels.length
        ) {
          setVisibleChannelsCount((prev) => prev + 50);
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(trigger);
    return () => observer.disconnect();
  }, [
    displayedChannels,
    filteredChannels.length,
    isLoading,
    visibleChannelsCount,
  ]);

  useEffect(() => {
    if (isLoading) return;
    const trigger = groupsTriggerRef.current;
    if (!trigger) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          visibleGroupsCount < filteredGroups.length
        ) {
          setVisibleGroupsCount((prev) => prev + 50);
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(trigger);
    return () => observer.disconnect();
  }, [displayedGroups, filteredGroups.length, isLoading, visibleGroupsCount]);
  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
      <aside className="w-80 border-r border-border flex flex-col bg-card/50">
        <div className="p-4 border-b border-border flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <Tv className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-lg tracking-tight">Neon IPTV</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск..."
              className="pl-9 bg-background/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <UploadDialog onUploadSuccess={() => loadChannels(false)} />
          {!selectedGroup && !searchQuery && (
            <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg text-[11px]">
              <button
                className={`py-1.5 rounded-md transition-colors cursor-pointer text-center ${
                  viewMode === "categories"
                    ? "bg-background shadow-sm font-medium"
                    : "text-muted-foreground"
                }`}
                onClick={() => setViewMode("categories")}
              >
                Папки
              </button>
              <button
                className={`py-1.5 rounded-md transition-colors cursor-pointer text-center ${
                  viewMode === "all"
                    ? "bg-background shadow-sm font-medium"
                    : "text-muted-foreground"
                }`}
                onClick={() => setViewMode("all")}
              >
                Все
              </button>
              <button
                className={`py-1.5 rounded-md transition-colors cursor-pointer text-center flex items-center justify-center gap-1 ${
                  viewMode === "favorites"
                    ? "bg-background shadow-sm font-medium text-yellow-500"
                    : "text-muted-foreground"
                }`}
                onClick={() => setViewMode("favorites")}
              >
                <Star className="h-3 w-3 fill-current" />
                {favoriteChannels.length}
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 h-full [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs">Загрузка базы...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedGroup || searchQuery ? (
                <div>
                  <div className="flex items-center justify-between px-1 mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate max-w-45">
                      {selectedGroup || "Поиск"}
                    </p>
                    {selectedGroup && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => setSelectedGroup(null)}
                      >
                        <ArrowLeft className="h-3 w-3" /> Назад
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {displayedChannels.map((channel, index) => (
                      <div
                        key={channel.id}
                        className={`w-full flex items-center justify-between pr-2 rounded-lg transition-colors group ${
                          activeChannel?.id === channel.id
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-accent"
                        }`}
                      >
                        <button
                          onClick={() => handleChannelSelect(channel)}
                          className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm text-left truncate cursor-pointer"
                        >
                          <span className="text-xs font-mono opacity-50 w-7 shrink-0 text-right">
                            {index + 1}
                          </span>
                          {channel.logo ? (
                            <img
                              src={channel.logo}
                              alt=""
                              className="h-5 w-5 object-contain shrink-0 rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Tv2 className="h-4 w-4 shrink-0 opacity-70" />
                          )}
                          <span className="truncate">{channel.name}</span>
                        </button>
                        <button
                          onClick={(e) => toggleFavorite(e, channel)}
                          className="p-1.5 rounded-md hover:bg-background/20 cursor-pointer"
                        >
                          <Star
                            className={`h-4 w-4 ${channel.isFavorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground opacity-40 group-hover:opacity-100"}`}
                          />
                        </button>
                      </div>
                    ))}
                    <div
                      ref={channelsTriggerRef}
                      className="h-4 flex justify-center items-center"
                    >
                      {visibleChannelsCount < filteredChannels.length && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              ) : viewMode === "all" || viewMode === "favorites" ? (
                <div>
                  <p className="px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {viewMode === "all"
                      ? `Все каналы (${channels.length})`
                      : `Избранное (${favoriteChannels.length})`}
                  </p>
                  <div className="space-y-1">
                    {displayedChannels.map((channel, index) => (
                      <div
                        key={channel.id}
                        className={`w-full flex items-center justify-between pr-2 rounded-lg transition-colors group ${
                          activeChannel?.id === channel.id
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-accent"
                        }`}
                      >
                        <button
                          onClick={() => handleChannelSelect(channel)}
                          className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm text-left truncate cursor-pointer"
                        >
                          <span className="text-xs font-mono opacity-50 w-7 shrink-0 text-right">
                            {index + 1}
                          </span>
                          {channel.logo ? (
                            <img
                              src={channel.logo}
                              alt=""
                              className="h-5 w-5 object-contain shrink-0 rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Tv2 className="h-4 w-4 shrink-0 opacity-70" />
                          )}
                          <div className="flex flex-col truncate">
                            <span className="truncate">{channel.name}</span>
                            <span
                              className={`text-[10px] truncate ${activeChannel?.id === channel.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                            >
                              {channel.group || "Общие"}
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={(e) => toggleFavorite(e, channel)}
                          className="p-1.5 rounded-md hover:bg-background/20 cursor-pointer"
                        >
                          <Star
                            className={`h-4 w-4 ${channel.isFavorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground opacity-40 group-hover:opacity-100"}`}
                          />
                        </button>
                      </div>
                    ))}
                    <div
                      ref={channelsTriggerRef}
                      className="h-4 flex justify-center items-center"
                    >
                      {visibleChannelsCount < filteredChannels.length && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Категории ({groups.length})
                  </p>
                  <div className="space-y-1">
                    {displayedGroups.map((group) => (
                      <Button
                        key={group}
                        variant="ghost"
                        className="w-full justify-between text-left font-normal px-3 py-2.5 cursor-pointer"
                        onClick={() => setSelectedGroup(group)}
                      >
                        <div className="flex items-center gap-3 truncate mr-2">
                          <Folder className="h-4 w-4 text-muted-foreground opacity-70" />
                          <span className="truncate">{group}</span>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {groupCounts[group]}
                        </span>
                      </Button>
                    ))}
                    <div
                      ref={groupsTriggerRef}
                      className="h-4 flex justify-center items-center"
                    >
                      {visibleGroupsCount < filteredGroups.length && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 bg-background">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-center flex-1">
          <VideoPlayer
            src={activeChannel?.url || ""}
            name={activeChannel?.name || ""}
          />
        </div>
      </main>
    </div>
  );
}
