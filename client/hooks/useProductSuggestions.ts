"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useDebouncedValue } from "@/hooks/Usecursorpagination";
import { fetchProductSuggestions } from "@/lib/api/Products.api";

export const useProductSuggestions = (input: string) => {
  const q = useDebouncedValue(input.trim(), 300);

  return useQuery({
    queryKey: ["product-suggest", q],
    queryFn: ({ signal }) => fetchProductSuggestions(q, signal),
    enabled: q.length >= 2,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
