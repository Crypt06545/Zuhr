"use client";

import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FieldError } from "@/components/common/FieldError";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  createExpenseApi,
  updateExpenseApi,
  type CreateExpenseBody,
  type ExpenseCategory,
  type ExpenseRow,
  type UpdateExpenseBody,
} from "@/lib/api/admin-expenses.api";
import { apiErrorMessage } from "@/lib/api/orders.api";
import {
  bdDateKey,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSES_KEY,
  FINANCE_KEY,
} from "@/lib/admin-expenses";
import { cn } from "@/lib/utils";

const MAX_AMOUNT = 100_000_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const cents = (amount: number) => Math.round(amount * 100);

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

type FormValues = {
  title: string;
  category: ExpenseCategory;
  amount: string;
  expenseDate: string;
  note: string;
};

const toValues = (expense: ExpenseRow | null): FormValues =>
  expense
    ? {
        title: expense.title,
        category: expense.category,
        amount: String(expense.amount),
        expenseDate: bdDateKey(expense.expenseDate),
        note: expense.note ?? "",
      }
    : {
        title: "",
        category: "other",
        amount: "",
        expenseDate: bdDateKey(),
        note: "",
      };

const Field = ({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) => (
  <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
    <Label htmlFor={id}>{label}</Label>
    {children}
    <FieldError message={error} />
  </div>
);

/* ============================================================
   একটি দিন বাছাই: ফিল্টারের DateRangePicker-এর মতো একই shadcn Calendar
   ============================================================ */

const ExpenseDatePicker = ({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
}) => {
  const [open, setOpen] = useState(false);

  const selected = DATE_PATTERN.test(value) ? fromKey(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={invalid}
            className={cn(
              "w-full justify-start gap-2 font-normal",
              !selected && "text-muted-foreground",
            )}
          />
        }
      >
        <CalendarDays className="h-4 w-4 shrink-0" />
        <span className="truncate">
          {selected ? formatKey(value) : "Pick a date"}
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(toKey(date));
            setOpen(false);
          }}
          captionLayout="dropdown"
          startMonth={new Date(2000, 0)}
          endMonth={new Date(new Date().getFullYear() + 1, 11)}
        />
      </PopoverContent>
    </Popover>
  );
};

const ExpenseForm = ({
  expense,
  onClose,
}: {
  expense: ExpenseRow | null;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ defaultValues: toValues(expense) });

  const save = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onSuccess: () => {
      toast.success(expense ? "Expense updated." : "Expense added.");
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      onClose();
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Failed to save the expense."));
      // অন্য কেউ বদলে থাকলে তালিকা নতুন করে আনি
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
    },
  });

  const onSubmit = (values: FormValues) => {
    const title = values.title.trim();
    const amount = Number(values.amount);
    const note = values.note.trim();

    if (!expense) {
      const body: CreateExpenseBody = {
        title,
        category: values.category,
        amount,
        expenseDate: values.expenseDate,
        ...(note && { note }),
      };

      save.mutate(() => createExpenseApi(body));
      return;
    }

    const body: UpdateExpenseBody = { expectedUpdatedAt: expense.updatedAt };
    let changed = false;

    if (title !== expense.title) {
      body.title = title;
      changed = true;
    }
    if (values.category !== expense.category) {
      body.category = values.category;
      changed = true;
    }
    if (cents(amount) !== cents(expense.amount)) {
      body.amount = amount;
      changed = true;
    }
    if (values.expenseDate !== bdDateKey(expense.expenseDate)) {
      body.expenseDate = values.expenseDate;
      changed = true;
    }
    if (note !== (expense.note ?? "").trim()) {
      body.note = note;
      changed = true;
    }

    if (!changed) {
      toast.info("Nothing to save.");
      return;
    }

    save.mutate(() => updateExpenseApi(expense._id, body));
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="e-title"
            label="Title"
            error={errors.title?.message}
            className="sm:col-span-2"
          >
            <Input
              id="e-title"
              maxLength={120}
              placeholder="e.g. Steadfast October bill"
              aria-invalid={!!errors.title}
              {...register("title", {
                validate: (value) => value.trim() !== "" || "Title is required",
              })}
            />
          </Field>

          <Field id="e-category" label="Category">
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="e-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {EXPENSE_CATEGORY_LABELS[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field
            id="e-amount"
            label="Amount (BDT)"
            error={errors.amount?.message}
          >
            <Input
              id="e-amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              aria-invalid={!!errors.amount}
              {...register("amount", {
                validate: (value) => {
                  const amount = Number(value);

                  if (value.trim() === "" || !Number.isFinite(amount)) {
                    return "Enter a valid amount";
                  }
                  if (amount <= 0) return "Must be more than 0";
                  if (amount > MAX_AMOUNT) return "Too large";
                  if (Math.abs(amount * 100 - cents(amount)) > 1e-6) {
                    return "At most 2 decimal places";
                  }

                  return true;
                },
              })}
            />
          </Field>

          <Field
            id="e-date"
            label="Expense date"
            error={errors.expenseDate?.message}
            className="sm:col-span-2"
          >
            <Controller
              name="expenseDate"
              control={control}
              rules={{
                validate: (value) =>
                  DATE_PATTERN.test(value) || "Pick the date of the expense",
              }}
              render={({ field }) => (
                <ExpenseDatePicker
                  id="e-date"
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!errors.expenseDate}
                />
              )}
            />
          </Field>

          <Field id="e-note" label="Note (optional)" className="sm:col-span-2">
            <Textarea
              id="e-note"
              rows={3}
              maxLength={500}
              placeholder="Invoice no., what it was for..."
              {...register("note")}
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={save.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={(!!expense && !isDirty) || save.isPending}
        >
          {save.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : expense ? (
            "Save changes"
          ) : (
            "Add expense"
          )}
        </Button>
      </div>
    </form>
  );
};

interface ExpenseFormSheetProps {
  open: boolean;
  // null = নতুন খরচ, না হলে এডিট
  expense: ExpenseRow | null;
  onClose: () => void;
}

export const ExpenseFormSheet = ({
  open,
  expense,
  onClose,
}: ExpenseFormSheetProps) => (
  <Sheet
    open={open}
    onOpenChange={(next) => {
      if (!next) onClose();
    }}
  >
    <SheetContent
      side="right"
      className="w-full gap-0 p-0 will-change-transform sm:max-w-xl data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
    >
      <SheetHeader className="px-6 pb-4 pt-6 text-left">
        <SheetTitle>{expense ? "Edit expense" : "Add expense"}</SheetTitle>
        <SheetDescription>
          {expense
            ? "Changes are saved under your name. To remove a wrong entry, void it from the list instead."
            : "Enter what was spent and on which day. Stock purchases and your own withdrawals are not expenses."}
        </SheetDescription>
      </SheetHeader>

      <ExpenseForm
        key={`${expense?._id ?? "new"}-${expense?.updatedAt ?? ""}`}
        expense={expense}
        onClose={onClose}
      />
    </SheetContent>
  </Sheet>
);
