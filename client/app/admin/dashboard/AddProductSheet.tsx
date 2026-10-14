"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AddProductForm } from "./AddProductForm";

export const AddProductSheet = () => {
  const [open, setOpen] = useState(false);

  // The sheet unmounts its content after closing, so the form is fresh each time
  return (
    <>
      <Button
        type="button"
        className="h-9 w-full gap-1.5 sm:w-auto"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Add product
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 will-change-transform sm:max-w-2xl data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
        >
          <SheetHeader className="px-6 pb-4 pt-6 text-left">
            <SheetTitle>Add product</SheetTitle>
            <SheetDescription>
              Fill in the details and add product images.
            </SheetDescription>
          </SheetHeader>

          <AddProductForm onDone={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};
