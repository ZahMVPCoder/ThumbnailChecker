import { ArrowLeft, Monitor, Smartphone, Tv, Globe } from "lucide-react";
import { DesktopHome } from "./previews/DesktopHome";
import { DesktopSearch } from "./previews/DesktopSearch";
import { WatchNextSidebar } from "./previews/WatchNextSidebar";
import { MobileHome } from "./previews/MobileHome";
import { MobileSearch } from "./previews/MobileSearch";
import { YouTubeTV } from "./previews/YouTubeTV";

interface PreviewSectionProps {
  thumbnail: string;
  title: string;
  onBack: () => void;
}

export function PreviewSection({ thumbnail, title, onBack }: PreviewSectionProps) {
  return (
    <div className="w-full min-h-screen p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Upload
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Platform Previews</h2>
          <p className="text-muted-foreground">
            See how your thumbnail and title appear across YouTube
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-semibold">Desktop Home Feed</h3>
            </div>
            <DesktopHome thumbnail={thumbnail} title={title} />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-semibold">Desktop Search Results</h3>
            </div>
            <DesktopSearch thumbnail={thumbnail} title={title} />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-semibold">Watch Next Sidebar</h3>
            </div>
            <WatchNextSidebar thumbnail={thumbnail} title={title} />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-semibold">Mobile App - Home</h3>
            </div>
            <MobileHome thumbnail={thumbnail} title={title} />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-semibold">Mobile App - Search</h3>
            </div>
            <MobileSearch thumbnail={thumbnail} title={title} />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Tv className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-semibold">YouTube TV</h3>
            </div>
            <YouTubeTV thumbnail={thumbnail} title={title} />
          </section>
        </div>
      </div>
    </div>
  );
}
