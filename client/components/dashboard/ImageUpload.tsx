"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { ImagePlus, X } from "lucide-react";

import { FieldError } from "@/components/common/FieldError";
import { cn } from "@/lib/utils";

export interface ImageItem {
  id: string;
  file: File;
  preview: string; // object URL, used only for the preview
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

interface ImageUploadProps {
  value: ImageItem[];
  onChange: (items: ImageItem[]) => void;
  max?: number;
  error?: string;
}

export const ImageUpload = ({
  value,
  onChange,
  max = 5,
  error,
}: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const latest = useRef(value);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    latest.current = value;
  }, [value]);

  // Release the preview URLs when this component goes away
  useEffect(
    () => () =>
      latest.current.forEach((item) => URL.revokeObjectURL(item.preview)),
    [],
  );

  const addFiles = (list: FileList | File[]) => {
    const accepted: ImageItem[] = [];
    let message = "";

    for (const file of Array.from(list)) {
      if (value.length + accepted.length >= max) {
        message = `You can upload up to ${max} images.`;
        break;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        message = `${file.name}: only JPG, PNG or WebP images are allowed.`;
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        message = `${file.name}: larger than ${MAX_SIZE_MB} MB.`;
        continue;
      }
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setUploadError(message);
    if (accepted.length > 0) onChange([...value, ...accepted]);
  };

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    // Lets the same file be selected again after removing it
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const remove = (id: string) => {
    const item = value.find((i) => i.id === id);
    if (item) URL.revokeObjectURL(item.preview);
    onChange(value.filter((i) => i.id !== id));
    setUploadError("");
  };

  const isFull = value.length >= max;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "rounded-lg border border-dashed p-2 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-input",
          (error || uploadError) && "border-destructive",
        )}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isFull}
          className="flex w-full flex-col items-center gap-1.5 rounded-md px-4 py-6 text-sm transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-accent-foreground">
            <ImagePlus className="h-5 w-5" />
          </span>
          <span className="font-medium">Click to upload or drag and drop</span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG or WebP, up to {MAX_SIZE_MB} MB each ({value.length}/{max})
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          onChange={handleSelect}
          className="hidden"
          tabIndex={-1}
        />
      </div>

      <FieldError message={uploadError || error} />

      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((item, index) => (
            <li key={item.id} className="space-y-1">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview}
                  alt={item.file.name}
                  className="h-full w-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium shadow-sm">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.file.name}`}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-destructive hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="truncate text-[11px] text-muted-foreground">
                {formatSize(item.file.size)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
