"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ChartWorkspace } from "@/components/ChartWorkspace";

function ChartPageContent() {
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol");
  const timeframe = searchParams.get("timeframe");
  return <ChartWorkspace defaultSymbol={symbol} defaultTimeframe={timeframe} />;
}

export default function ChartPage() {
  return (
    <Suspense>
      <ChartPageContent />
    </Suspense>
  );
}