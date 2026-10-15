"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

// Shape of every paginated list response from the backend
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number; // optional: only if the backend sends it
}

interface Options<T, F extends object> {
  queryKey: readonly unknown[];
  fetcher: (
    params: F & { limit: number; cursor?: string },
  ) => Promise<CursorPage<T>>;
  filters: F;
  limit: number;
}

type Nav = { key: string; cursors: (string | undefined)[]; index: number };

// The backend only gives "next". To support "Previous", we remember the cursor
// that was used to load every page we have visited.
export function useCursorPagination<
  T,
  F extends object = Record<string, unknown>,
>({ queryKey, fetcher, filters, limit }: Options<T, F>) {
  // Search, filter or page size changed: start again from page 1
  const resetKey = JSON.stringify([filters, limit]);
  const [nav, setNav] = useState<Nav>({
    key: resetKey,
    cursors: [undefined],
    index: 0,
  });
  const current: Nav =
    nav.key === resetKey
      ? nav
      : { key: resetKey, cursors: [undefined], index: 0 };
  const cursor = current.cursors[current.index];

  const query = useQuery({
    queryKey: [...queryKey, filters, limit, cursor ?? "first"],
    queryFn: () => fetcher({ ...filters, limit, cursor }),
    placeholderData: keepPreviousData, // keeps the old rows while the next page loads
  });

  const data = query.data;

  const goNext = () => {
    if (!data?.nextCursor || query.isPlaceholderData) return;
    setNav({
      key: resetKey,
      cursors: [
        ...current.cursors.slice(0, current.index + 1),
        data.nextCursor,
      ],
      index: current.index + 1,
    });
  };

  const goPrev = () => {
    if (current.index === 0) return;
    setNav({ ...current, index: current.index - 1 });
  };

  // After deleting the last item of a page, step back instead of showing an empty page
  const emptyPage =
    !query.isFetching && !!data && data.items.length === 0 && current.index > 0;
  useEffect(() => {
    if (emptyPage) {
      setNav({ ...current, index: current.index - 1 });
    }
  }, [emptyPage, current]);

  return {
    items: data?.items ?? [],
    total: data?.total,
    page: current.index + 1,
    hasPrev: current.index > 0,
    hasNext: !query.isPlaceholderData && !!data?.hasMore && !!data.nextCursor,
    goNext,
    goPrev,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
