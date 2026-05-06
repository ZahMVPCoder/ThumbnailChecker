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
  const [error, setError] = useState("");
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
            error={error}
            onThumbnailChange={handleThumbnailChange}
            onTitleChange={setTitle}
            onPreview={handlePreview}
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
