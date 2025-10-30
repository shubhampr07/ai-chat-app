'use client';

import { useQuery } from '@tanstack/react-query';
import { SearchResult } from '@/types/chat';

async function searchAPI(query: string, type: 'general' | 'person' = 'general'): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query, type, limit: '10' });
  const response = await fetch(`/api/search?${params}`);

  if (!response.ok) {
    throw new Error('Search failed');
  }

  const data = await response.json();
  return data.results;
}

export function useSearch(query: string, type: 'general' | 'person' = 'general') {
  return useQuery({
    queryKey: ['search', query, type],
    queryFn: () => searchAPI(query, type),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
