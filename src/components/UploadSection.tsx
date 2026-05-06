import { Upload, ImageIcon } from "lucide-react";

interface UploadSectionProps {
  thumbnail: string | null;
  title: string;
  submissions: {
    id: number;
    title: string;
    thumbnail: string;
    createdAt: string;
  }[];
  isSaving: boolean;
  error: string;
  onThumbnailChange: (file: File) => void;
  onTitleChange: (title: string) => void;
  onPreview: () => void;
}

export function UploadSection({
  thumbnail,
  title,
  submissions,
  isSaving,
  error,
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
          disabled={!thumbnail || !title || isSaving}
          className="w-full py-3 px-6 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving Thumbnail..." : "Save and Preview Across Platforms"}
        </button>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Saved Thumbnail Checks</h2>
          <p className="text-sm text-muted-foreground">
            Recent submissions loaded from the database
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-lg border border-border px-4 py-5 text-sm text-muted-foreground">
            No saved thumbnail checks yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {submissions.map((submission) => (
              <article
                key={submission.id}
                className="grid grid-cols-[112px_1fr] gap-3 rounded-lg border border-border p-3"
              >
                <img
                  src={submission.thumbnail}
                  alt=""
                  className="aspect-video w-full rounded object-cover"
                />
                <div className="min-w-0">
                  <h3 className="truncate text-base font-medium">{submission.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Saved {new Date(submission.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
