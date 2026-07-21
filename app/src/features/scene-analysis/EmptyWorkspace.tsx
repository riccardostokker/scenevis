import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyWorkspace({ onFiles }: { onFiles: (files: File[]) => void }) {
  return (
    <main className="empty-workspace">
      <div className="empty-copy">
        <p className="eyebrow">New Study</p>
        <h1>Compare Visibility across Locations</h1>
        <p>
          Add several RAW or raster images, mark the target in each scenario, and export one
          self-contained comparison report.
        </p>
        <label className={cn(buttonVariants({ size: "lg" }), "file-control")}>
          Choose Images
          <input
            type="file"
            multiple
            accept=".cr2,.dng,.jpg,.jpeg,.png,.tif,.tiff,image/*"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) onFiles(files);
              event.target.value = "";
            }}
          />
        </label>
        <span className="drop-hint">or drop images anywhere in this window</span>
      </div>
      <div className="empty-frames" aria-hidden="true">
        <span className="empty-frame" />
        <span className="empty-frame" />
        <span className="empty-frame" />
      </div>
      <p className="memory-policy">
        Images, regions, and measurements remain in browser memory for this session.
      </p>
    </main>
  );
}
