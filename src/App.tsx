import { useEffect, useState } from "react";
import { UploadSection } from "./components/UploadSection";
import { PreviewSection } from "./components/PreviewSection";
import { ThemeToggle } from "./components/ThemeToggle";

interface ThumbnailSubmission {
  id: number;
  deviceId: string;
  title: string;
  thumbnail: string;
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
  const [deviceId] = useState(getDeviceId);

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
    };
    reader.readAsDataURL(file);
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
        body: JSON.stringify({ deviceId, title, thumbnail }),
      });

      if (!response.ok) {
        throw new Error("Unable to save this thumbnail.");
      }

      const savedSubmission = (await response.json()) as ThumbnailSubmission;
      setSubmissions((currentSubmissions) => [
        savedSubmission,
        ...currentSubmissions.filter((submission) => submission.id !== savedSubmission.id),
      ]);
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
        body: JSON.stringify({ title, thumbnail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to analyze this thumbnail.");
      }

      setCoachFeedback(data as ThumbnailCoachFeedback);
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
            error={error}
            onThumbnailChange={handleThumbnailChange}
            onTitleChange={setTitle}
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
