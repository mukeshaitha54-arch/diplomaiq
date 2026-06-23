"use server";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import { logUsageAnalytics } from "./analytics";

export interface ECETRecommendation {
  id: string;
  college_code: string;
  college_name: string;
  branch_code: string;
  branch_name: string;
  closing_rank: number;
  source: string;
  source_type: string;
  confidence_score: number;
  verified_flag: boolean;
  year: number;
  bucket: 'Dream' | 'Moderate' | 'Safe';
  reason: string;
}

export interface ECETResult {
  recommendations: ECETRecommendation[];
  explanations: {
    Dream?: string;
    Moderate?: string;
    Safe?: string;
  };
}

export async function getECETRecommendations(params: {
  rank: number;
  branch?: string;
  category: string;
  gender: string;
}): Promise<ECETResult> {
  const { adminClient } = await import("@/lib/insforge/client");

  // Determine current context (e.g. prioritize 2026 forecast or 2025 actual)
  // We'll fetch the most relevant cutoffs based on params
  let query = adminClient.database
    .from('ecet_cutoffs')
    .select('*')
    .eq('category', params.category);

  if (params.branch && params.branch !== 'ALL') {
    query = query.eq('branch_code', params.branch);
  }

  // Usually "General" gender includes all (Boys/Girls), but "Female" means girls quota
  // This logic depends on the specific counseling rules, but for now we'll match exactly
  // or allow General to fall back.
  query = query.eq('gender', params.gender);
  
  // Just query the latest year available per college/branch for the combination
  // We'll pull a large set and filter in memory to find the 3 buckets
  const { data, error } = await query;
  
  if (error || !data) {
    console.error("Error fetching ECET cutoffs:", error);
    return { recommendations: [], explanations: {} };
  }

  // Deduplicate by college/branch taking the highest year (2026 forecast > 2025 actual)
  const latestMap = new Map<string, any>();
  for (const row of data) {
    const key = `${row.college_code}-${row.branch_code}`;
    const existing = latestMap.get(key);
    if (!existing || row.year > existing.year) {
      latestMap.set(key, row);
    }
  }

  const latestRecords = Array.from(latestMap.values());
  const rank = params.rank;

  const recommendations: ECETRecommendation[] = [];

  for (const record of latestRecords) {
    let bucket: 'Dream' | 'Moderate' | 'Safe' | null = null;
    let reason = "";

    const cutoff = record.closing_rank;

    // Dream: Cutoff is slightly lower than rank (meaning you are ranked slightly worse than cutoff)
    // Actually, in TS ECET, a lower rank number is better.
    // If your rank is 1000, and cutoff is 900, it's a stretch/dream.
    // If cutoff is 1100, you are well within it.
    
    if (rank > cutoff && rank <= cutoff + 5000) {
      bucket = 'Dream';
      reason = `Your rank (${rank}) is close to the historical cutoff (${cutoff}). A good stretch option.`;
    } else if (rank <= cutoff && rank > cutoff - 2000) {
      bucket = 'Moderate';
      reason = `Your rank is well within the typical cutoff range. Solid chance of admission.`;
    } else if (rank <= cutoff - 2000) {
      bucket = 'Safe';
      reason = `Your rank is comfortably better than the cutoff. High probability of admission.`;
    }

    if (bucket) {
      recommendations.push({
        id: record.id,
        college_code: record.college_code,
        college_name: record.college_name,
        branch_code: record.branch_code,
        branch_name: record.branch_name,
        closing_rank: record.closing_rank,
        source: record.source,
        source_type: record.source_type,
        confidence_score: record.confidence_score,
        verified_flag: record.verified_flag,
        year: record.year,
        bucket,
        reason
      });
    }
  }

  // Sort: Dream -> Moderate -> Safe, and by rank difference
  recommendations.sort((a, b) => {
    const bucketOrder = { Dream: 1, Moderate: 2, Safe: 3 };
    if (bucketOrder[a.bucket] !== bucketOrder[b.bucket]) {
      return bucketOrder[a.bucket] - bucketOrder[b.bucket];
    }
    return a.closing_rank - b.closing_rank;
  });

  // Generate Group-Level AI Explanations to save tokens
  // We'll call the AI Gateway in parallel for buckets that have items
  const explanations: { Dream?: string, Moderate?: string, Safe?: string } = {};

  const generateBucketExplanation = async (bucket: 'Dream'|'Moderate'|'Safe', items: ECETRecommendation[]) => {
    if (items.length === 0) return;
    const { generateAIResponse } = await import('@/lib/actions/ai');
    
    // Pick top 5 to avoid token bloat
    const sample = items.slice(0, 5).map(c => `${c.college_name} (${c.branch_code}) - Cutoff: ${c.closing_rank}`).join("\\n");
    
    const prompt = `
You are an expert Telangana ECET advisor.
The student has Rank ${rank}, Category ${params.category}, Gender ${params.gender}.
They are targeting the "${bucket}" category of colleges.

Below is the STRICT and ONLY list of historical colleges they qualify for in this bucket.
Colleges in Context:
${sample}

CRITICAL RULES:
1. You may explain why this bucket of colleges is classified as "${bucket}" for this student's rank.
2. You may explain cutoff patterns or recommendation classifications.
3. You may NOT invent, hallucinate, or suggest any colleges not present in the Colleges in Context above.
4. You may NOT suggest alternatives.
5. Do not list the colleges again, just give the explanation.
`;

    try {
      explanations[bucket] = await generateAIResponse('openai', 'gpt-4o-mini', prompt);
    } catch (e) {
      console.error(e);
      explanations[bucket] = "AI Explanation temporarily unavailable.";
    }
  };

  await Promise.all([
    generateBucketExplanation('Dream', recommendations.filter(r => r.bucket === 'Dream')),
    generateBucketExplanation('Moderate', recommendations.filter(r => r.bucket === 'Moderate')),
    generateBucketExplanation('Safe', recommendations.filter(r => r.bucket === 'Safe'))
  ]);

  await logUsageAnalytics('ecet_search', 'ECET Advisor', { 
    rank: params.rank, 
    branch: params.branch, 
    category: params.category 
  });

  return { recommendations, explanations };
}
