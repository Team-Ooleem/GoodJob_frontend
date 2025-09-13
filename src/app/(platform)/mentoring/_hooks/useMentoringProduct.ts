"use client";

import { useQuery } from "@tanstack/react-query";
import { getMentoringProduct, MentoringProduct } from "../_apis/mentoring-products.api";

export function useMentoringProduct(productIdx?: string | number) {
  return useQuery<MentoringProduct, Error>({
    queryKey: ["mentoringProduct", productIdx],
    queryFn: () => getMentoringProduct(productIdx as string | number),
    enabled: productIdx !== undefined && productIdx !== null && productIdx !== "",
  });
}

