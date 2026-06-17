import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, Eye, Layers, LineChart, PlaySquare, Sparkles, Type } from "lucide-react";
import { UploadSection } from "./components/UploadSection";
import { PreviewSection } from "./components/PreviewSection";
import { ThemeToggle } from "./components/ThemeToggle";

interface ThumbnailSubmission {
  id: number;
  deviceId: string;
  title: string;
  thumbnail: string;
  persona?: string | null;
  audience?: string | null;
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

interface YouTubePublishStatus {
  configured: boolean;
  requiredScopes: string[];
  missing: string[];
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
  persona: string,
  audience: string,
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
      id: "persona-added",
      label: "Creator persona defined",
      passed: persona.trim().length > 0,
      helper: "Add the creator angle so feedback matches the channel strategy.",
    },
    {
      id: "audience-added",
      label: "Audience defined",
      passed: audience.trim().length > 0,
      helper: "Name the intended viewers so clickability is judged against the right audience.",
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
  const [persona, setPersona] = useState("");
  const [audience, setAudience] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [submissions, setSubmissions] = useState<ThumbnailSubmission[]>([]);
  const [youtubeStatus, setYoutubeStatus] = useState<YouTubePublishStatus | null>(null);
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
    setChecklist(createThumbnailChecklist(title, thumbnail, persona, audience, coachFeedback));
  }, [title, thumbnail, persona, audience, coachFeedback]);

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

  useEffect(() => {
    const loadYouTubeStatus = async () => {
      try {
        const response = await fetch("/api/youtube-publish-status");

        if (!response.ok) {
          throw new Error("Unable to load YouTube API status.");
        }

        setYoutubeStatus((await response.json()) as YouTubePublishStatus);
      } catch {
        setYoutubeStatus({
          configured: false,
          requiredScopes: [
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ],
          missing: ["YouTube API status unavailable"],
        });
      }
    };

    loadYouTubeStatus();
  }, []);

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

  const handlePersonaChange = (nextPersona: string) => {
    setPersona(nextPersona);
    setCoachFeedback(null);
    setCurrentSubmissionId(null);
  };

  const handleAudienceChange = (nextAudience: string) => {
    setAudience(nextAudience);
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
        body: JSON.stringify({ audience, deviceId, persona, title, thumbnail }),
      });

      const analysisData = await analysisResponse.json();

      if (!analysisResponse.ok) {
        throw new Error(analysisData.error || "Unable to analyze this thumbnail.");
      }

      const feedback = analysisData as ThumbnailCoachFeedback;
      const nextChecklist = createThumbnailChecklist(title, thumbnail, persona, audience, feedback);

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
          persona,
          audience,
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
                  persona={persona}
                  audience={audience}
                  submissions={submissions}
                  youtubeStatus={youtubeStatus}
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
                  onPersonaChange={handlePersonaChange}
                  onAudienceChange={handleAudienceChange}
                  onPreview={handlePreview}
                  onUpdateSubmission={handleUpdateSubmission}
                  onDeleteSubmission={handleDeleteSubmission}
                  onClearSubmissions={handleClearSubmissions}
                />
              </div>
            </section>

            <BeginnerGuideSection />
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
          <a href="#basics" className="rounded-md px-4 py-2 text-sm hover:bg-muted">
            Basics
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

function BeginnerGuideSection() {
  const basics = [
    {
      title: "Start With One Clear Idea",
      body: "Pick the single moment, promise, or reaction your video is about. A beginner-friendly thumbnail should make one thing obvious in under a second.",
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      title: "Make It Readable Small",
      body: "Use large shapes, strong contrast, and only a few words. If it works on a phone screen, it will usually work everywhere else.",
      icon: <Eye className="h-5 w-5" />,
    },
    {
      title: "Keep Text Short",
      body: "Aim for 2-5 punchy words on the thumbnail. Let the video title explain the detail while the image creates the first click impulse.",
      icon: <Type className="h-5 w-5" />,
    },
    {
      title: "Build Simple Layers",
      body: "Use a clear subject, a clean background, and one supporting detail like an arrow, object, or expression. Too many details compete for attention.",
      icon: <Layers className="h-5 w-5" />,
    },
  ];

  const checklist = [
    "Use a 16:9 canvas, ideally 1280x720.",
    "Put the main subject close to the center or one side.",
    "Avoid tiny text, thin fonts, and low-contrast colors.",
    "Match the title and thumbnail so they tell the same story.",
    "Preview it on mobile before publishing.",
  ];

  return (
    <section id="basics" className="border-y border-border bg-background px-6 py-16">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4 text-accent" />
            Beginner thumbnail basics
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight md:text-4xl">
              New to thumbnails? Start with the fundamentals.
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              A strong thumbnail does not need to be complicated. Focus on clarity, readable text, and a visual reason for someone to stop scrolling.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-5">
            <h3 className="mb-3 font-semibold">Quick beginner checklist</h3>
            <div className="grid gap-2">
              {checklist.map((item) => (
                <div key={item} className="flex gap-3 text-sm leading-6">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {basics.map((tip) => (
            <article key={tip.title} className="rounded-lg border border-border bg-muted/35 p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background">
                {tip.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{tip.title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{tip.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogSection() {
  const posts = [
    {
      title: "How to Make a Thumbnail Readable on Mobile",
      category: "Creator guide",
      body: "A practical guide to checking whether text, faces, contrast, and layout still work when the thumbnail is small.",
      url: "https://www.clickstudio.co/blog/youtube-thumbnail-design-guide",
    },
    {
      title: "3 Title Patterns That Build Curiosity",
      category: "CTR strategy",
      body: "Title frameworks that pair well with thumbnails by creating a clear promise, tension, or unanswered question.",
      url: "https://support.google.com/youtube/answer/12340300?hl=en",
    },
    {
      title: "What to Check Before Publishing a Video",
      category: "Publishing checklist",
      body: "A final pass for title, thumbnail, metadata, and mobile visibility before sending a video live.",
      url: "https://thumbnailcreator.ai/blog/youtube-thumbnail-best-practices",
    },
  ];

  return (
    <section id="blog" className="border-t border-border bg-muted/35 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4 text-accent" />
            Creator resources
          </div>
          <h2 className="text-3xl font-bold leading-tight">Learn, then test inside the tool.</h2>
          <p className="text-base leading-7 text-muted-foreground">
            These references support the same workflow as ThumbnailChecker: make the idea clear, preview it small, and publish with stronger metadata.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <article key={post.title} className="flex h-full flex-col justify-between rounded-lg border border-border bg-background p-5">
              <div className="space-y-3">
                <span className="inline-flex w-fit rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {post.category}
                </span>
                <h3 className="text-lg font-semibold leading-snug">{post.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{post.body}</p>
              </div>
              <div className="mt-5 border-t border-border pt-4">
                <a
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-accent"
                >
                  Read resource
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
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
          <a href="#basics" className="block text-sm text-white/70 hover:text-white">Thumbnail basics</a>
          <a href="#blog" className="block text-sm text-white/70 hover:text-white">Blog</a>
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
