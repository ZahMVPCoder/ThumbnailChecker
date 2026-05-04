import { useState } from "react";
import { UploadSection } from "./components/UploadSection";
import { PreviewSection } from "./components/PreviewSection";
import { ThemeToggle } from "./components/ThemeToggle";

export default function App() {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleThumbnailChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnail(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePreview = () => {
    if (thumbnail && title) {
      setShowPreview(true);
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