import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Input, Label } from "@/components/ui/Field";
import { useSystemMode } from "@/hooks/useSystemMode";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  hint?: string;
}

export function ImageUploadField({ label, value, onChange, folder = "general", hint }: ImageUploadFieldProps) {
  const { imageUploadsConfigured } = useSystemMode();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", folder);
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed.");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 shrink-0 border border-ivory/15 bg-charcoal-light overflow-hidden flex items-center justify-center">
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus size={20} className="text-ivory/30" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />
          {imageUploadsConfigured ? (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold hover:text-gold-light transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                {uploading ? "Uploading…" : "Upload Image"}
              </button>
            </>
          ) : (
            <p className="text-xs text-ivory/35">
              Paste an image URL above. Ask your developer to configure Cloudinary to enable direct uploads.
            </p>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
          {hint && <p className="text-xs text-ivory/35">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
