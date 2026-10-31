"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ExpenseRow } from "@/lib/api/admin-expenses.api";
import { formatPrice } from "@/lib/api/Products.api";

interface ExpenseVoidDialogProps {
  expense: ExpenseRow | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const VoidForm = ({
  expense,
  isLoading,
  onClose,
  onConfirm,
}: Omit<ExpenseVoidDialogProps, "expense"> & { expense: ExpenseRow }) => {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();

  return (
    <>
      <DialogHeader>
        <DialogTitle>Void this expense?</DialogTitle>
        <DialogDescription>
          {expense.title} ({formatPrice(expense.amount)}) will stop counting in
          the profit report. The entry stays in the list with your reason, and
          cannot be edited afterwards.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="void-reason">Reason (required)</Label>
        <Textarea
          id="void-reason"
          rows={3}
          maxLength={300}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Entered twice by mistake"
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={!trimmed || isLoading}
          onClick={() => onConfirm(trimmed)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Voiding...
            </>
          ) : (
            "Void expense"
          )}
        </Button>
      </DialogFooter>
    </>
  );
};

export const ExpenseVoidDialog = ({
  expense,
  isLoading,
  onClose,
  onConfirm,
}: ExpenseVoidDialogProps) => (
  <Dialog
    open={expense !== null}
    onOpenChange={(open) => {
      if (!open && !isLoading) onClose();
    }}
  >
    <DialogContent>
      {expense && (
        <VoidForm
          key={expense._id}
          expense={expense}
          isLoading={isLoading}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      )}
    </DialogContent>
  </Dialog>
);
