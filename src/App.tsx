import { useEffect, useState } from "react";
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
    if (!thumbnail || !title || isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/thumbnails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId,
          title,
          thumbnail,
          aiScore: coachFeedback?.overallClickabilityScore,
          aiFeedback: coachFeedback,
          checklist,
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
      setError(err instanceof Error ? err.message : "Unable to save this thumbnail.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setShowPreview(false);
  };

  const handleAnalyze = async () => {
    if (!thumbnail || !title || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setCoachFeedback(null);

    try {
      const response = await fetch("/api/analyze-thumbnail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceId, title, thumbnail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to analyze this thumbnail.");
      }

      const feedback = data as ThumbnailCoachFeedback;
      const nextChecklist = createThumbnailChecklist(title, thumbnail, feedback);

      setCoachFeedback(feedback);
      setChecklist(nextChecklist);

      if (currentSubmissionId !== null) {
        const updateResponse = await fetch("/api/thumbnails", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: currentSubmissionId,
            deviceId,
            aiScore: feedback.overallClickabilityScore,
            aiFeedback: feedback,
            checklist: nextChecklist,
          }),
        });

        if (updateResponse.ok) {
          const updatedSubmission = (await updateResponse.json()) as ThumbnailSubmission;
          setSubmissions((currentSubmissions) =>
            currentSubmissions.map((submission) =>
              submission.id === updatedSubmission.id ? updatedSubmission : submission,
            ),
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to analyze this thumbnail.");
    } finally {
      setIsAnalyzing(false);
    }
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
      <ThemeToggle />

      {!showPreview ? (
        <div className="flex items-center justify-center min-h-screen">
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
            onAnalyze={handleAnalyze}
            onUpdateSubmission={handleUpdateSubmission}
            onDeleteSubmission={handleDeleteSubmission}
            onClearSubmissions={handleClearSubmissions}
          />
        </div>
      ) : (
        <PreviewSection
          thumbnail={thumbnail!}
          title={title}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
