import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  useGetPortfolio,
  useGetRecommendations,
  useGetWatchlist,
  analyzeStock,
  addPosition,
  updatePosition,
  deletePosition,
  addToWatchlist,
  removeFromWatchlist,
  getGetPortfolioQueryKey,
  getGetWatchlistQueryKey,
  getGetRecommendationsQueryKey
} from "@workspace/api-client-react";
import type { 
  AnalyzeRequest, 
  AddPositionRequest, 
  UpdatePositionRequest, 
  AddWatchlistRequest,
  ErrorResponse
} from "@workspace/api-client-react/src/generated/api.schemas";

// Re-export generated queries for convenience
export { useGetPortfolio, useGetRecommendations, useGetWatchlist };

// Custom mutation wrappers to handle cache invalidation
export function useAppAnalyzeStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AnalyzeRequest) => analyzeStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetRecommendationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
    }
  });
}

export function useAppAddPosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddPositionRequest) => addPosition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey() });
    }
  });
}

export function useAppUpdatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdatePositionRequest }) => updatePosition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey() });
    }
  });
}

export function useAppDeletePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey() });
    }
  });
}

export function useAppAddToWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddWatchlistRequest) => addToWatchlist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
    }
  });
}

export function useAppRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => removeFromWatchlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
    }
  });
}
