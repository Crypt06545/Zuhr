"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

// Keys are plain YYYY-MM-DD built from local date parts (no timezone shift)
const toKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const fromKey = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatKey = (key: string) =>
  fromKey(key).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

interface DateRangePickerProps {
  from: string | null;
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
}

export const DateRangePicker = ({
  from,
  to,
  onChange,
}: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);

  const selected: DateRange | undefined = from
    ? { from: fromKey(from), to: to ? fromKey(to) : undefined }
    : undefined;

  const text = !from
    ? "Pick dates"
    : to && to !== from
      ? `${formatKey(from)} – ${formatKey(to)}`
      : formatKey(from);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start gap-2 font-normal sm:w-auto",
              !from && "text-muted-foreground",
            )}
          />
        }
      >
        <CalendarDays className="h-4 w-4 shrink-0" />
        <span className="truncate">{text}</span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={selected}
          defaultMonth={selected?.from}
          onSelect={(range) =>
            onChange(
              range?.from ? toKey(range.from) : null,
              range?.to ? toKey(range.to) : null,
            )
          }
          captionLayout="dropdown"
          startMonth={new Date(2000, 0)}
          endMonth={new Date(new Date().getFullYear() + 1, 11)}
        />
        <div className="flex items-center justify-between gap-2 border-t border-border p-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!from}
            onClick={() => onChange(null, null)}
          >
            Clear
          </Button>
          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
