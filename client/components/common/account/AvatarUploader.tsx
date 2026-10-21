"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/hooks/use-auth";
import { uploadAvatarApi } from "@/lib/api/user.api";
import { PROFILE_QUERY_KEY } from "@/hooks/Useprofile";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

type AvatarUploaderProps = { name: string; avatarUrl?: string | null };

const AvatarUploader = ({ name, avatarUrl }: AvatarUploaderProps) => {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // object URL মেমরিতে জমে না থাকে
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const upload = useMutation({
    mutationFn: uploadAvatarApi,
    onSuccess: () => {
      toast.success("Profile photo updated.");
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error) => {
      setPreview(null);
      toast.error(getErrorMessage(error, "Failed to upload photo."));
    },
  });

  const onPick = (file: File | undefined) => {
    if (!file) return;

    if (!ALLOWED.includes(file.type)) {
      toast.error("Use a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 2 MB or smaller.");
      return;
    }

    setPreview(URL.createObjectURL(file));
    upload.mutate(file);
  };

  const shown = preview ?? avatarUrl ?? null;

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-24 w-24 shrink-0">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt={`${name} profile photo`}
            className="h-24 w-24 rounded-full border border-border object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary"
          >
            {initials(name)}
          </div>
        )}

        {upload.isPending && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={upload.isPending}
          onClick={() => input.current?.click()}
        >
          <Camera className="mr-2 h-4 w-4" />
          Change photo
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WebP. Max 2 MB.
        </p>
        <input
          ref={input}
          type="file"
          accept={ALLOWED.join(",")}
          className="sr-only"
          aria-label="Upload profile photo"
          onChange={(e) => {
            onPick(e.target.files?.[0]);
            e.target.value = ""; // একই ফাইল আবার বাছা যায়
          }}
        />
      </div>
    </div>
  );
};

export default AvatarUploader;
