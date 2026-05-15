import { Check, Lightbulb, Pencil, Target, Trash2, Upload, X } from "lucide-react";
import { useState } from "react";

interface ThumbnailCoachFeedback {
  overallClickabilityScore: number;
  thumbnailReadability: string;
  titleStrength: string;
  curiosityClickAppeal: string;
  mobileVisibility: string;
  suggestedImprovements: string[];
  betterTitleIdeas: string[];
  thumbnailTextSuggestions: string[];
}

interface ThumbnailChecklistItem {
  id: string;
  label: string;
  passed: boolean;
  helper: string;
}

interface UploadSectionProps {
  thumbnail: string | null;
  title: string;
  submissions: {
    id: number;
    title: string;
    thumbnail: string;
    aiScore?: number | null;
    checklist?: ThumbnailChecklistItem[] | null;
    createdAt: string;
  }[];
  isSaving: boolean;
  isAnalyzing: boolean;
  updatingSubmissionId: number | null;
  deletingSubmissionId: number | null;
  isClearingSubmissions: boolean;
  coachFeedback: ThumbnailCoachFeedback | null;
  checklist: ThumbnailChecklistItem[];
  error: string;
  onThumbnailChange: (file: File) => void;
  onTitleChange: (title: string) => void;
  onPreview: () => void;
  onUpdateSubmission: (id: number, title: string) => void;
  onDeleteSubmission: (id: number) => void;
  onClearSubmissions: () => void;
}

export function UploadSection({
  thumbnail,
  title,
  submissions,
  isSaving,
  isAnalyzing,
  updatingSubmissionId,
  deletingSubmissionId,
  isClearingSubmissions,
  coachFeedback,
  checklist,
  error,
  onThumbnailChange,
  onTitleChange,
  onPreview,
  onUpdateSubmission,
  onDeleteSubmission,
  onClearSubmissions,
}: UploadSectionProps) {
  const [editingSubmissionId, setEditingSubmissionId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onThumbnailChange(file);
    }
  };

  const startEditing = (id: number, currentTitle: string) => {
    setEditingSubmissionId(id);
    setEditingTitle(currentTitle);
  };

  const cancelEditing = () => {
    setEditingSubmissionId(null);
    setEditingTitle("");
  };

  const saveEditing = (id: number) => {
    onUpdateSubmission(id, editingTitle);
    setEditingSubmissionId(null);
    setEditingTitle("");
  };

  const clearSubmissions = () => {
    if (window.confirm("Clear all saved thumbnail checks for this device?")) {
      onClearSubmissions();
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
            className="w-full px-4 py-3 bg-input-background text-black placeholder:text-gray-500 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="mt-1 text-xs text-muted-foreground">
            {title.length} characters
          </div>
        </div>

        <button
          onClick={onPreview}
          disabled={!thumbnail || !title || isSaving || isAnalyzing}
          className="w-full py-3 px-6 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving || isAnalyzing ? "Analyzing and Saving..." : "Save, Analyze & Preview"}
        </button>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </div>

      {coachFeedback ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">AI Thumbnail Coach</h2>
            <p className="text-sm text-muted-foreground">
              Practical CTR feedback from a hosted vision model
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                <h3 className="font-semibold">CTR Prediction Score</h3>
              </div>
              <div className="text-4xl font-bold">
                {coachFeedback.overallClickabilityScore}
                <span className="text-lg text-muted-foreground">/10</span>
              </div>
            </article>

            <FeedbackCard title="Thumbnail Readability" body={coachFeedback.thumbnailReadability} />
            <FeedbackCard title="Title Strength" body={coachFeedback.titleStrength} />
            <FeedbackCard title="Curiosity / Click Appeal" body={coachFeedback.curiosityClickAppeal} />
            <FeedbackCard title="Mobile Visibility" body={coachFeedback.mobileVisibility} />
          </div>

          <FeedbackList
            title="Suggested Improvements"
            items={coachFeedback.suggestedImprovements}
            icon={<Lightbulb className="h-5 w-5 text-accent" />}
          />
          <FeedbackList title="3 Better Title Ideas" items={coachFeedback.betterTitleIdeas} />
          <FeedbackList title="Thumbnail Text Suggestions" items={coachFeedback.thumbnailTextSuggestions} />
        </section>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Thumbnail Checklist</h2>
          <p className="text-sm text-muted-foreground">
            Quick readiness checks before you publish
          </p>
        </div>

        <div className="grid gap-2">
          {checklist.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3"
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  item.passed
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {item.passed ? <Check className="h-3 w-3" /> : null}
              </div>
              <div>
                <h3 className="text-sm font-medium">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.helper}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Saved Thumbnail Checks</h2>
            <p className="text-sm text-muted-foreground">
              Recent submissions loaded from the database
            </p>
          </div>

          {submissions.length > 0 ? (
            <button
              type="button"
              onClick={clearSubmissions}
              disabled={isClearingSubmissions}
              className="flex shrink-0 items-center gap-2 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isClearingSubmissions ? "Clearing..." : "Clear All"}
            </button>
          ) : null}
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
                className="grid grid-cols-[112px_1fr_auto] gap-3 rounded-lg border border-border p-3"
              >
                <img
                  src={submission.thumbnail}
                  alt=""
                  className="aspect-video w-full rounded object-cover"
                />
                <div className="min-w-0">
                  {editingSubmissionId === submission.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      className="w-full rounded border border-border bg-input-background px-3 py-2 text-base"
                    />
                  ) : (
                    <h3 className="truncate text-base font-medium">{submission.title}</h3>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Saved {new Date(submission.createdAt).toLocaleDateString()}
                  </p>
                  {typeof submission.aiScore === "number" ? (
                    <p className="mt-1 text-sm font-medium text-accent">
                      CTR prediction: {submission.aiScore}/10
                    </p>
                  ) : null}
                  {submission.checklist?.length ? (
                    <p className="text-xs text-muted-foreground">
                      Checklist: {submission.checklist.filter((item) => item.passed).length}/
                      {submission.checklist.length} complete
                    </p>
                  ) : null}
                </div>
                <div className="flex items-start gap-1">
                  {editingSubmissionId === submission.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => saveEditing(submission.id)}
                        disabled={updatingSubmissionId === submission.id}
                        className="rounded-md border border-border p-2 hover:bg-accent/50 disabled:opacity-50"
                        aria-label="Save title"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-md border border-border p-2 hover:bg-accent/50"
                        aria-label="Cancel editing"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditing(submission.id, submission.title)}
                        className="rounded-md border border-border p-2 hover:bg-accent/50"
                        aria-label="Edit title"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSubmission(submission.id)}
                        disabled={deletingSubmissionId === submission.id}
                        className="rounded-md border border-destructive/40 p-2 text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Delete saved thumbnail check"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FeedbackCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-lg border border-border p-4">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
    </article>
  );
}

function FeedbackList({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon?: React.ReactNode;
}) {
  return (
    <article className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="grid gap-2">
        {items.map((item, index) => (
          <div key={`${title}-${item}`} className="rounded-md bg-muted px-3 py-2 text-sm">
            {title === "3 Better Title Ideas" ? `${index + 1}. ` : ""}
            {item}
          </div>
        ))}
      </div>
    </article>
  );
}
