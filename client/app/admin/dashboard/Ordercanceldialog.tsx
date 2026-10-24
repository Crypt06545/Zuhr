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
import type { AdminOrderRow } from "@/lib/api/admin-orders.api";

interface OrderCancelDialogProps {
  order: AdminOrderRow | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (note?: string) => void;
}

const CancelForm = ({
  order,
  isLoading,
  onClose,
  onConfirm,
}: Omit<OrderCancelDialogProps, "order"> & { order: AdminOrderRow }) => {
  const [note, setNote] = useState("");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cancel order {order.orderNumber}?</DialogTitle>
        <DialogDescription>
          The items go back into stock. A cancelled order cannot be reopened.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="cancel-note">Reason (optional)</Label>
        <Textarea
          id="cancel-note"
          rows={3}
          maxLength={300}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Customer asked to cancel"
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Keep order
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isLoading}
          onClick={() => onConfirm(note.trim() || undefined)}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cancel order
        </Button>
      </DialogFooter>
    </>
  );
};

export const OrderCancelDialog = ({
  order,
  isLoading,
  onClose,
  onConfirm,
}: OrderCancelDialogProps) => (
  <Dialog
    open={order !== null}
    onOpenChange={(open) => {
      if (!open && !isLoading) onClose();
    }}
  >
    <DialogContent className="sm:max-w-md">
      {order && (
        <CancelForm
          key={order._id}
          order={order}
          isLoading={isLoading}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      )}
    </DialogContent>
  </Dialog>
);
