import { Upload, ImageIcon } from "lucide-react";

interface UploadSectionProps {
  thumbnail: string | null;
  title: string;
  onThumbnailChange: (file: File) => void;
  onTitleChange: (title: string) => void;
  onPreview: () => void;
}

export function UploadSection({
  thumbnail,
  title,
  onThumbnailChange,
  onTitleChange,
  onPreview,
}: UploadSectionProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onThumbnailChange(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">ThumbnailChecker</h1>
        <p className="text-muted-foreground">
          Preview your YouTube thumbnail across all platforms before you publish
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block mb-2">Upload Thumbnail</label>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="thumbnail-upload"
            />
            <label
              htmlFor="thumbnail-upload"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt="Thumbnail preview"
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <div className="text-center space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    Click to upload thumbnail
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Recommended: 1280x720 (16:9)
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block mb-2">
            Video Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter your video title..."
            className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="mt-1 text-xs text-muted-foreground">
            {title.length} characters
          </div>
        </div>

        <button
          onClick={onPreview}
          disabled={!thumbnail || !title}
          className="w-full py-3 px-6 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Preview Across Platforms
        </button>
      </div>
    </div>
  );
}
