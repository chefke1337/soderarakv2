"use client";

import dynamic from "next/dynamic";
import { GA_ID } from "@/lib/analytics";

const AnalyticsController = dynamic(() => import("@/components/AnalyticsController"), {
  ssr: false,
  loading: () => null,
});

export function AnalyticsBanner() {
  return GA_ID ? <AnalyticsController /> : null;
}
