interface DesktopSearchProps {
  thumbnail: string;
  title: string;
}

export function DesktopSearch({ thumbnail, title }: DesktopSearchProps) {
  const maxChars = 80;
  const truncatedTitle = title.length > maxChars ? title.slice(0, maxChars) + "..." : title;

  return (
    <div className="bg-[#0f0f0f] dark:bg-[#0f0f0f] p-6 rounded-lg">
      <div className="max-w-3xl flex gap-4">
        <div className="relative w-[360px] aspect-video rounded-xl overflow-hidden flex-shrink-0">
          <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
            12:34
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white text-lg font-normal leading-6 mb-1 line-clamp-2">
            {truncatedTitle}
          </h3>
          <div className="text-[#aaaaaa] text-xs mb-3">
            1.2M views • 2 days ago
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-[#ff0000] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-medium">YT</span>
            </div>
            <span className="text-[#aaaaaa] text-xs">Channel Name</span>
          </div>
          <p className="text-[#aaaaaa] text-xs line-clamp-2">
            Sample video description text that appears in search results...
          </p>

          <div className="mt-3 text-xs text-[#aaaaaa]">
            Title length: {title.length}/{maxChars} characters {title.length > maxChars && "(truncated)"}
          </div>
        </div>
      </div>
    </div>
  );
}
