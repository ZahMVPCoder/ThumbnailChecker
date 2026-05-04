interface YouTubeTVProps {
  thumbnail: string;
  title: string;
}

export function YouTubeTV({ thumbnail, title }: YouTubeTVProps) {
  const maxChars = 50;
  const truncatedTitle = title.length > maxChars ? title.slice(0, maxChars) + "..." : title;

  return (
    <div className="bg-[#0f0f0f] dark:bg-[#0f0f0f] p-6 rounded-lg">
      <div className="max-w-[320px]">
        <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
          <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
          <div className="absolute bottom-2 right-2 bg-black/90 text-white text-sm px-2 py-1 rounded">
            12:34
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-white text-base font-medium leading-6 line-clamp-2">
            {truncatedTitle}
          </h3>
          <div className="text-[#aaaaaa] text-sm">
            Channel Name
          </div>
          <div className="text-[#aaaaaa] text-sm">
            1.2M views • 2 days ago
          </div>
        </div>

        <div className="mt-4 text-xs text-[#aaaaaa]">
          Title length: {title.length}/{maxChars} characters {title.length > maxChars && "(truncated)"}
        </div>
      </div>
    </div>
  );
}
