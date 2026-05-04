interface MobileSearchProps {
  thumbnail: string;
  title: string;
}

export function MobileSearch({ thumbnail, title }: MobileSearchProps) {
  const maxChars = 65;
  const truncatedTitle = title.length > maxChars ? title.slice(0, maxChars) + "..." : title;

  return (
    <div className="bg-[#0f0f0f] dark:bg-[#0f0f0f] p-6 rounded-lg flex justify-center">
      <div className="w-full max-w-[375px]">
        <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
          <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            12:34
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-[#ff0000] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">YT</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white text-sm font-normal leading-5 mb-1 line-clamp-2">
              {truncatedTitle}
            </h3>
            <div className="text-[#aaaaaa] text-xs space-y-0.5">
              <div>Channel Name</div>
              <div>1.2M views • 2 days ago</div>
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
