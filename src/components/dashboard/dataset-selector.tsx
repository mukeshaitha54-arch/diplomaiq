"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function DatasetSelector({ activeDataset }: { activeDataset: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (dataset: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("dataset", dataset);
    router.push(`?${params.toString()}`);
    router.refresh();
  };

  const options = [
    { id: 'semester', label: 'Semester Final' },
    { id: 'mid1', label: 'Mid-1' },
    { id: 'mid2', label: 'Mid-2' },
    { id: 'internal', label: 'Internal' }
  ];

  return (
    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800 w-fit">
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => handleSelect(opt.id)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            activeDataset === opt.id 
              ? "bg-indigo-600 text-white shadow-sm" 
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
