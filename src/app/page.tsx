"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/videoPlayer";
import { UploadDialog } from "@/components/uploadDialog";
import {
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tv,
  Tv2,
  Search,
  Loader2,
  Folder,
  ArrowLeft,
  Star,
  Sun,
  Moon,
} from "lucide-react";

interface Channel {
  id: string;
  name: string;
  group: string;
  logo: string;
  url: string;
  isFavorite: boolean;
}

interface SidebarInnerProps {
  channels: Channel[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedGroup: string | null;
  handleGroupSelect: (group: string | null) => void;
  activeChannel: Channel | null;
  handleChannelSelect: (channel: Channel) => void;
  viewMode: "categories" | "all" | "favorites";
  handleViewModeChange: (mode: "categories" | "all" | "favorites") => void;
  visibleChannelsCount: number;
  visibleGroupsCount: number;
  mounted: boolean;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  favoriteChannels: Channel[];
  displayedChannels: Channel[];
  displayedGroups: string[];
  groupCounts: Record<string, number>;
  groups: string[];
  filteredChannels: Channel[];
  filteredGroups: string[];
  sidebarScrollRef: React.RefObject<HTMLDivElement | null>;
  channelsTriggerRef: React.RefObject<HTMLDivElement | null>;
  groupsTriggerRef: React.RefObject<HTMLDivElement | null>;
  loadChannels: () => void;
  toggleFavorite: (e: React.MouseEvent, channel: Channel) => void;
}

function SidebarInner({
  channels,
  isLoading,
  searchQuery,
  setSearchQuery,
  selectedGroup,
  handleGroupSelect,
  activeChannel,
  handleChannelSelect,
  viewMode,
  handleViewModeChange,
  visibleChannelsCount,
  visibleGroupsCount,
  mounted,
  theme,
  setTheme,
  favoriteChannels,
  displayedChannels,
  displayedGroups,
  groupCounts,
  groups,
  filteredChannels,
  filteredGroups,
  sidebarScrollRef,
  channelsTriggerRef,
  groupsTriggerRef,
  loadChannels,
  toggleFavorite,
}: SidebarInnerProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="flex flex-col h-full bg-card/50">
      <div
        className={`p-4 border-b border-border flex flex-col gap-3 ${isCollapsed ? "px-1 py-4 items-center" : ""}`}
      >
        <div
          className={`flex items-center w-full ${isCollapsed ? "flex-col gap-3 justify-center" : "justify-between px-1"}`}
        >
          <div
            className={`flex items-center gap-2 ${isCollapsed ? "hidden" : ""}`}
          >
            <Tv className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-lg tracking-tight">Neon IPTV</h1>
          </div>
          <div
            className={`flex items-center gap-1 ${isCollapsed ? "flex-col gap-3 w-full justify-center items-center" : ""}`}
          >
            {mounted && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )}
            <SidebarTrigger />
          </div>
        </div>
        {!isCollapsed && (
          <>
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
            <UploadDialog onUploadSuccess={loadChannels} />
            {!selectedGroup && !searchQuery && (
              <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg text-[11px]">
                <Button
                  variant={viewMode === "all" ? "outline" : "ghost"}
                  size="xs"
                  className="cursor-pointer text-center py-1 h-auto w-full"
                  onClick={() => handleViewModeChange("all")}
                >
                  Все
                </Button>
                <Button
                  variant={viewMode === "categories" ? "outline" : "ghost"}
                  size="xs"
                  className="cursor-pointer text-center py-1 h-auto w-full"
                  onClick={() => handleViewModeChange("categories")}
                >
                  Категории
                </Button>
                <Button
                  variant={viewMode === "favorites" ? "outline" : "ghost"}
                  size="xs"
                  className={`cursor-pointer text-center py-1 h-auto w-full flex items-center justify-center gap-1 ${
                    viewMode === "favorites" ? "text-yellow-500" : ""
                  }`}
                  onClick={() => handleViewModeChange("favorites")}
                >
                  <Star className="h-3 w-3 fill-current" />
                  {favoriteChannels.length}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <div
        ref={sidebarScrollRef}
        className={
          `flex-1 overflow-y-auto px-4 py-3 h-full ${
            isCollapsed ? "hidden" : ""
          } [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent ` +
          `[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full`
        }
      >
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
                      onClick={() => handleGroupSelect(null)}
                    >
                      <ArrowLeft className="h-3 w-3" /> Назад
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {displayedChannels.map((channel, index) => (
                    <div
                      key={channel.id}
                      data-active-channel={channel.id}
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
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => toggleFavorite(e, channel)}
                        className="p-1.5 rounded-md cursor-pointer h-7 w-7 flex items-center justify-center"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            channel.isFavorite
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-muted-foreground opacity-40 group-hover:opacity-100"
                          }`}
                        />
                      </Button>
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
                      data-active-channel={channel.id}
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
                            className={`text-[10px] truncate ${
                              activeChannel?.id === channel.id
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {channel.group || "Общие"}
                          </span>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => toggleFavorite(e, channel)}
                        className="p-1.5 rounded-md cursor-pointer h-7 w-7 flex items-center justify-center"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            channel.isFavorite
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-muted-foreground opacity-40 group-hover:opacity-100"
                          }`}
                        />
                      </Button>
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
                      onClick={() => handleGroupSelect(group)}
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
    </div>
  );
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
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const channelsTriggerRef = useRef<HTMLDivElement>(null);
  const groupsTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadChannels = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/channels");
      if (response.ok) {
        const fetchedChannels = await response.json();
        const rawData: Channel[] = fetchedChannels || [];
        const favIdsJson = localStorage.getItem("neon_iptv_fav_ids");
        const favIds: string[] = favIdsJson ? JSON.parse(favIdsJson) : [];
        const data = rawData.map((c) => ({
          ...c,
          isFavorite: favIds.includes(String(c.id)) ? true : c.isFavorite,
        }));
        setChannels(data);
        const savedMode = localStorage.getItem("neon_iptv_view_mode");
        if (
          savedMode === "all" ||
          savedMode === "categories" ||
          savedMode === "favorites"
        ) {
          setViewMode(savedMode as any);
        }
        const savedGroup = localStorage.getItem("neon_iptv_selected_group");
        if (savedGroup) {
          setSelectedGroup(savedGroup);
        }
        const lastChannelId = localStorage.getItem("neon_iptv_last_channel_id");
        if (lastChannelId) {
          const last = data.find((c) => String(c.id) === String(lastChannelId));
          if (last) {
            setActiveChannel(last);
          } else if (data.length > 0) {
            setActiveChannel(data[0]);
          }
        } else if (data.length > 0) {
          setActiveChannel(data[0]);
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    setVisibleChannelsCount(50);
    setVisibleGroupsCount(50);
  }, [searchQuery, selectedGroup, viewMode]);

  const favoriteChannels = useMemo(
    () => channels.filter((c) => c.isFavorite),
    [channels],
  );

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

  useEffect(() => {
    if (!activeChannel || filteredChannels.length === 0) return;
    const index = filteredChannels.findIndex((c) => c.id === activeChannel.id);
    if (index !== -1 && index >= visibleChannelsCount) {
      setVisibleChannelsCount(index + 20);
    }
    setTimeout(() => {
      const scrollContainer = sidebarScrollRef.current;
      const activeElem = document.querySelector(
        `[data-active-channel="${activeChannel.id}"]`,
      ) as HTMLElement;
      if (scrollContainer && activeElem) {
        const containerTop = scrollContainer.getBoundingClientRect().top;
        const elemTop = activeElem.getBoundingClientRect().top;
        const targetTop = scrollContainer.scrollTop + (elemTop - containerTop);
        scrollContainer.scrollTo({ top: targetTop - 12, behavior: "smooth" });
      }
    }, 150);
  }, [activeChannel, filteredChannels, visibleChannelsCount]);

  const handleChannelSelect = (channel: Channel) => {
    setActiveChannel(channel);
    localStorage.setItem("neon_iptv_last_channel_id", String(channel.id));
  };

  const handleViewModeChange = (mode: "categories" | "all" | "favorites") => {
    setViewMode(mode);
    localStorage.setItem("neon_iptv_view_mode", mode);
    if (mode !== "categories") {
      setSelectedGroup(null);
      localStorage.removeItem("neon_iptv_selected_group");
    }
  };

  const handleGroupSelect = (group: string | null) => {
    setSelectedGroup(group);
    if (group) {
      localStorage.setItem("neon_iptv_selected_group", group);
    } else {
      localStorage.removeItem("neon_iptv_selected_group");
    }
  };

  const toggleFavorite = (e: React.MouseEvent, channel: Channel) => {
    e.stopPropagation();
    const nextState = !channel.isFavorite;
    const favIdsJson = localStorage.getItem("neon_iptv_fav_ids");
    let favIds: string[] = favIdsJson ? JSON.parse(favIdsJson) : [];
    if (nextState) {
      if (!favIds.includes(String(channel.id))) {
        favIds.push(String(channel.id));
      }
    } else {
      favIds = favIds.filter((id) => id !== String(channel.id));
    }
    localStorage.setItem("neon_iptv_fav_ids", JSON.stringify(favIds));
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
    fetch("/api/channels/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: channel.id, isFavorite: nextState }),
    }).catch((err) => console.error(err));
  };

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
    const uniqueGroups = new Set<string>();
    const source = viewMode === "favorites" ? favoriteChannels : channels;
    source.forEach((c) => {
      uniqueGroups.add(c.group || "Общие");
    });
    return Array.from(uniqueGroups);
  }, [channels, favoriteChannels, viewMode]);

  const filteredGroups = useMemo(
    () =>
      groups.filter((g) => g.toLowerCase().includes(searchQuery.toLowerCase())),
    [groups, searchQuery],
  );

  const displayedChannels = useMemo(
    () => filteredChannels.slice(0, visibleChannelsCount),
    [filteredChannels, visibleChannelsCount],
  );

  const displayedGroups = useMemo(
    () => filteredGroups.slice(0, visibleGroupsCount),
    [filteredGroups, visibleGroupsCount],
  );

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
      <Sidebar collapsible="icon" className="border-r border-border bg-card/50">
        <SidebarContent>
          <SidebarInner
            channels={channels}
            isLoading={isLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedGroup={selectedGroup}
            handleGroupSelect={handleGroupSelect}
            activeChannel={activeChannel}
            handleChannelSelect={handleChannelSelect}
            viewMode={viewMode}
            handleViewModeChange={handleViewModeChange}
            visibleChannelsCount={visibleChannelsCount}
            visibleGroupsCount={visibleGroupsCount}
            mounted={mounted}
            theme={theme}
            setTheme={setTheme}
            favoriteChannels={favoriteChannels}
            displayedChannels={displayedChannels}
            displayedGroups={displayedGroups}
            groupCounts={groupCounts}
            groups={groups}
            filteredChannels={filteredChannels}
            filteredGroups={filteredGroups}
            sidebarScrollRef={sidebarScrollRef}
            channelsTriggerRef={channelsTriggerRef}
            groupsTriggerRef={groupsTriggerRef}
            loadChannels={loadChannels}
            toggleFavorite={toggleFavorite}
          />
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 bg-background h-full w-full">
        <div className="w-full h-full flex items-center justify-center">
          <VideoPlayer
            src={activeChannel?.url ?? ""}
            name={activeChannel?.name ?? ""}
          />
        </div>
      </main>
    </div>
  );
}
