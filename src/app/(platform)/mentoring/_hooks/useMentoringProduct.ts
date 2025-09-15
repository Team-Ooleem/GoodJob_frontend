"use client";

import { useQuery } from "@tanstack/react-query";
import { getMentoringProduct, MentoringProduct, getMentoringProductSlots, MentoringProductSlots } from "../_apis/mentoring-products.api";

export function useMentoringProduct(productIdx?: string | number) {
  return useQuery<MentoringProduct, Error>({
    queryKey: ["mentoringProduct", productIdx],
    queryFn: () => getMentoringProduct(productIdx as string | number),
    enabled: productIdx !== undefined && productIdx !== null && productIdx !== "",
  });
}

export function useMentoringProductSlots(productIdx?: string | number) {
  return useQuery<MentoringProductSlots, Error>({
    queryKey: ["mentoringProductSlots", productIdx],
    queryFn: () => getMentoringProductSlots(productIdx as string | number),
    enabled: productIdx !== undefined && productIdx !== null && productIdx !== "",
  });
}

