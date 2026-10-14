"use client";

import { Link2, X } from "lucide-react";

import { FieldError } from "@/components/common/FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ImageUrlsInputProps {
  value: string[];
  onChange: (urls: string[]) => void;
  // How many more links fit after the uploaded files are counted
  max: number;
  errors?: (string | undefined)[];
}

export const ImageUrlsInput = ({
  value,
  onChange,
  max,
  errors = [],
}: ImageUrlsInputProps) => {
  const update = (index: number, url: string) =>
    onChange(value.map((item, i) => (i === index ? url : item)));

  const remove = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    onChange(next.length === 0 ? [""] : next);
  };

  const canAdd = value.length < max;

  return (
    <div className="space-y-3">
      {value.map((url, index) => (
        <div key={index} className="space-y-1.5">
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => update(index, e.target.value)}
              placeholder="https://example.com/image.jpg"
              aria-invalid={!!errors[index]}
              aria-label={`Image link ${index + 1}`}
            />
            {value.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                aria-label={`Remove link ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <FieldError message={errors[index]} />
        </div>
      ))}

      {canAdd && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, ""])}
        >
          <Link2 className="mr-2 h-3.5 w-3.5" />
          Add link
        </Button>
      )}
    </div>
  );
};
