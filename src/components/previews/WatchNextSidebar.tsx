interface WatchNextSidebarProps {
  thumbnail: string;
  title: string;
}

export function WatchNextSidebar({ thumbnail, title }: WatchNextSidebarProps) {
  const maxChars = 60;
  const truncatedTitle = title.length > maxChars ? title.slice(0, maxChars) + "..." : title;

  return (
    <div className="bg-[#0f0f0f] dark:bg-[#0f0f0f] p-6 rounded-lg">
      <div className="max-w-md">
        <div className="flex gap-2">
          <div className="relative w-[168px] aspect-video rounded-lg overflow-hidden flex-shrink-0">
            <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
              12:34
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white text-sm font-medium leading-5 mb-1 line-clamp-2">
              {truncatedTitle}
            </h3>
            <div className="text-[#aaaaaa] text-xs space-y-0.5">
              <div>Channel Name</div>
              <div>1.2M views</div>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-[#aaaaaa]">
          Title length: {title.length}/{maxChars} characters {title.length > maxChars && "(truncated)"}
        </div>
      </div>
    </div>
  );
}
