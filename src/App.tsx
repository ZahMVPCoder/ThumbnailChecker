import { useEffect, useState } from "react";
import { BookOpen, LineChart, PlaySquare } from "lucide-react";
import { UploadSection } from "./components/UploadSection";
import { PreviewSection } from "./components/PreviewSection";
import { ThemeToggle } from "./components/ThemeToggle";

interface ThumbnailSubmission {
  id: number;
  deviceId: string;
  title: string;
  thumbnail: string;
  aiScore?: number | null;
  aiFeedback?: ThumbnailCoachFeedback | null;
  checklist?: ThumbnailChecklistItem[] | null;
  createdAt: string;
}

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

const deviceIdStorageKey = "thumbnailchecker-device-id";

function getDeviceId() {
  const existingDeviceId = window.localStorage.getItem(deviceIdStorageKey);

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const nextDeviceId = window.crypto.randomUUID();
  window.localStorage.setItem(deviceIdStorageKey, nextDeviceId);
  return nextDeviceId;
}

function createThumbnailChecklist(
  title: string,
  thumbnail: string | null,
  feedback: ThumbnailCoachFeedback | null,
): ThumbnailChecklistItem[] {
  const trimmedTitle = title.trim();
  const titleLength = trimmedTitle.length;

  return [
    {
      id: "thumbnail-uploaded",
      label: "Thumbnail uploaded",
      passed: Boolean(thumbnail),
      helper: "Add a real thumbnail image before testing clickability.",
    },
    {
      id: "title-added",
      label: "Video title added",
      passed: titleLength > 0,
      helper: "A clear title gives the thumbnail context.",
    },
    {
      id: "title-length",
      label: "Title is scan-friendly",
      passed: titleLength >= 20 && titleLength <= 70,
      helper: "Aim for a title around 20-70 characters.",
    },
    {
      id: "ai-reviewed",
      label: "AI coach reviewed it",
      passed: Boolean(feedback),
      helper: "Run the AI coach to get CTR-focused feedback.",
    },
    {
      id: "score-ready",
      label: "Clickability score is 7+",
      passed: (feedback?.overallClickabilityScore ?? 0) >= 7,
      helper: "A score under 7 means the thumbnail/title likely need another pass.",
    },
    {
      id: "mobile-reviewed",
      label: "Mobile visibility reviewed",
      passed: Boolean(feedback?.mobileVisibility),
      helper: "Most viewers see thumbnails small, so mobile readability matters.",
    },
  ];
}

export default function App() {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [submissions, setSubmissions] = useState<ThumbnailSubmission[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [updatingSubmissionId, setUpdatingSubmissionId] = useState<number | null>(null);
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<number | null>(null);
  const [isClearingSubmissions, setIsClearingSubmissions] = useState(false);
  const [error, setError] = useState("");
  const [coachFeedback, setCoachFeedback] = useState<ThumbnailCoachFeedback | null>(null);
  const [checklist, setChecklist] = useState<ThumbnailChecklistItem[]>([]);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<number | null>(null);
  const [deviceId] = useState(getDeviceId);

  useEffect(() => {
    setChecklist(createThumbnailChecklist(title, thumbnail, coachFeedback));
  }, [title, thumbnail, coachFeedback]);

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const response = await fetch(`/api/thumbnails?deviceId=${encodeURIComponent(deviceId)}`);

        if (!response.ok) {
          throw new Error("Unable to load saved thumbnails.");
        }

        const data = (await response.json()) as ThumbnailSubmission[];
        setSubmissions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load saved thumbnails.");
      }
    };

    loadSubmissions();
  }, [deviceId]);

  const handleThumbnailChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnail(reader.result as string);
      setCoachFeedback(null);
      setCurrentSubmissionId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    setCoachFeedback(null);
    setCurrentSubmissionId(null);
  };

  const handlePreview = async () => {
    if (!thumbnail || !title || isSaving || isAnalyzing) {
      return;
    }

    setIsSaving(true);
    setIsAnalyzing(true);
    setError("");
    setCoachFeedback(null);

    try {
      const analysisResponse = await fetch("/api/analyze-thumbnail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceId, title, thumbnail }),
      });

      const analysisData = await analysisResponse.json();

      if (!analysisResponse.ok) {
        throw new Error(analysisData.error || "Unable to analyze this thumbnail.");
      }

      const feedback = analysisData as ThumbnailCoachFeedback;
      const nextChecklist = createThumbnailChecklist(title, thumbnail, feedback);

      setCoachFeedback(feedback);
      setChecklist(nextChecklist);

      const response = await fetch("/api/thumbnails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId,
          title,
          thumbnail,
          aiScore: feedback.overallClickabilityScore,
          aiFeedback: feedback,
          checklist: nextChecklist,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save this thumbnail.");
      }

      const savedSubmission = (await response.json()) as ThumbnailSubmission;
      setSubmissions((currentSubmissions) => [
        savedSubmission,
        ...currentSubmissions.filter((submission) => submission.id !== savedSubmission.id),
      ]);
      setCurrentSubmissionId(savedSubmission.id);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save and analyze this thumbnail.");
    } finally {
      setIsSaving(false);
      setIsAnalyzing(false);
    }
  };

  const handleBack = () => {
    setShowPreview(false);
  };

  const handleUpdateSubmission = async (id: number, nextTitle: string) => {
    if (updatingSubmissionId !== null) {
      return;
    }

    setUpdatingSubmissionId(id);
    setError("");

    try {
      const response = await fetch("/api/thumbnails", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, deviceId, title: nextTitle }),
      });

      if (!response.ok) {
        throw new Error("Unable to update this saved thumbnail.");
      }

      const updatedSubmission = (await response.json()) as ThumbnailSubmission;
      setSubmissions((currentSubmissions) =>
        currentSubmissions.map((submission) =>
          submission.id === updatedSubmission.id ? updatedSubmission : submission,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this saved thumbnail.");
    } finally {
      setUpdatingSubmissionId(null);
    }
  };

  const handleDeleteSubmission = async (id: number) => {
    if (deletingSubmissionId !== null || isClearingSubmissions) {
      return;
    }

    setDeletingSubmissionId(id);
    setError("");

    try {
      const response = await fetch("/api/thumbnails", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, deviceId }),
      });

      if (!response.ok) {
        throw new Error("Unable to delete this saved thumbnail.");
      }

      setSubmissions((currentSubmissions) =>
        currentSubmissions.filter((submission) => submission.id !== id),
      );
      if (currentSubmissionId === id) {
        setCurrentSubmissionId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete this saved thumbnail.");
    } finally {
      setDeletingSubmissionId(null);
    }
  };

  const handleClearSubmissions = async () => {
    if (submissions.length === 0 || isClearingSubmissions || deletingSubmissionId !== null) {
      return;
    }

    setIsClearingSubmissions(true);
    setError("");

    try {
      const response = await fetch("/api/thumbnails", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceId, clearAll: true }),
      });

      if (!response.ok) {
        throw new Error("Unable to clear saved thumbnails.");
      }

      setSubmissions([]);
      setCurrentSubmissionId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to clear saved thumbnails.");
    } finally {
      setIsClearingSubmissions(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <ThemeToggle />

      {!showPreview ? (
        <>
          <main>
            <section className="mx-auto max-w-7xl px-6 pb-10 pt-16">
              <div className="max-w-4xl space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
                  <LineChart className="h-4 w-4 text-accent" />
                  Thumbnail previews, AI feedback, and creator-ready checks
                </div>
                <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
                  YouTube Thumbnail Preview Tool
                </h1>
                <p className="max-w-5xl text-lg leading-8 text-muted-foreground">
                  Upload a thumbnail, add your title, and see how the video will feel across YouTube-style layouts. ThumbnailChecker saves your checks, predicts clickability, and gives practical feedback before you publish.
                </p>
              </div>
            </section>

            <section id="tool" className="mx-auto max-w-7xl px-6 pb-16">
              <div className="rounded-lg bg-muted/60 p-6 md:p-8">
                <UploadSection
                  thumbnail={thumbnail}
                  title={title}
                  submissions={submissions}
                  isSaving={isSaving}
                  isAnalyzing={isAnalyzing}
                  updatingSubmissionId={updatingSubmissionId}
                  deletingSubmissionId={deletingSubmissionId}
                  isClearingSubmissions={isClearingSubmissions}
                  coachFeedback={coachFeedback}
                  checklist={checklist}
                  error={error}
                  onThumbnailChange={handleThumbnailChange}
                  onTitleChange={handleTitleChange}
                  onPreview={handlePreview}
                  onUpdateSubmission={handleUpdateSubmission}
                  onDeleteSubmission={handleDeleteSubmission}
                  onClearSubmissions={handleClearSubmissions}
                />
              </div>
            </section>

            <BlogSection />
          </main>

          <SiteFooter />
        </>
      ) : (
        <main className="pt-6">
          <PreviewSection
            thumbnail={thumbnail!}
            title={title}
            onBack={handleBack}
          />
        </main>
      )}
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-3 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
            <PlaySquare className="h-5 w-5" />
          </span>
          ThumbnailChecker
        </a>

        <nav className="flex items-center gap-1 rounded-lg border border-border bg-background p-1 shadow-sm">
          <a href="#tool" className="rounded-md px-4 py-2 text-sm hover:bg-muted">
            Tool
          </a>
          <a href="#blog" className="rounded-md px-4 py-2 text-sm hover:bg-muted">
            Blog
          </a>
          <a href="#tool" className="rounded-md bg-foreground px-4 py-2 text-sm text-background">
            Get started
          </a>
        </nav>
      </div>
    </header>
  );
}

function BlogSection() {
  const posts = [
    {
      title: "How to Make a Thumbnail Readable on Mobile",
      date: "Creator guide",
      image:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "3 Title Patterns That Build Curiosity",
      date: "CTR strategy",
      image:
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "What to Check Before Publishing a Video",
      date: "Publishing checklist",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <section id="blog" className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8 flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-accent" />
        <h2 className="text-3xl font-bold">Creator Resources</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <article key={post.title} className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
            <img src={post.image} alt="" className="aspect-[16/10] w-full object-cover grayscale" />
            <div className="space-y-3 p-5">
              <h3 className="text-xl font-semibold leading-snug">{post.title}</h3>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{post.date}</span>
                <span>Read &gt;</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-[#18191c] px-6 py-14 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-3 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#18191c]">
              <PlaySquare className="h-5 w-5" />
            </span>
            ThumbnailChecker
          </div>
          <p className="max-w-sm text-sm leading-6 text-white/70">
            Thumbnail, title, and clickability testing for YouTube creators.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Product</h3>
          <a href="#tool" className="block text-sm text-white/70 hover:text-white">Preview tool</a>
          <a href="#blog" className="block text-sm text-white/70 hover:text-white">Blog</a>
          <a href="#tool" className="block text-sm text-white/70 hover:text-white">AI coach</a>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Creator Tools</h3>
          <a href="#tool" className="block text-sm text-white/70 hover:text-white">CTR prediction</a>
          <a href="#tool" className="block text-sm text-white/70 hover:text-white">Mobile preview</a>
          <a href="#tool" className="block text-sm text-white/70 hover:text-white">Thumbnail checklist</a>
        </div>
      </div>
    </footer>
  );
}
