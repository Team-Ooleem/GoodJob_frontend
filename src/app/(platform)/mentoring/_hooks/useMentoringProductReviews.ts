"use client";

import { useQuery } from "@tanstack/react-query";
import { getMentoringProductReviews, MentoringReviewsResponse } from "../_apis/mentoring-reviews.api";

export function useMentoringProductReviews(productIdx?: string | number, limit: number = 10) {
  return useQuery<MentoringReviewsResponse, Error>({
    queryKey: ["mentoringProductReviews", productIdx, limit],
    queryFn: () => getMentoringProductReviews({ productIdx: productIdx as string | number, limit }),
    enabled: productIdx !== undefined && productIdx !== null && productIdx !== "",
  });
}

