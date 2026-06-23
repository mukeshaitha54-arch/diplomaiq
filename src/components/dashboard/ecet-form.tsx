"use client";

import { useState } from "react";
import { getECETRecommendations, ECETRecommendation, ECETResult } from "@/lib/actions/ecet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle2, Navigation, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function ECETForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ECETResult | null>(null);
  
  const [rank, setRank] = useState<string>("500");
  const [branch, setBranch] = useState<string>("CSE");
  const [category, setCategory] = useState<string>("OC");
  const [gender, setGender] = useState<string>("General");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await getECETRecommendations({
        rank: parseInt(rank, 10),
        branch,
        category,
        gender
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderBucket = (bucketName: 'Dream' | 'Moderate' | 'Safe', items: ECETRecommendation[]) => {
    if (items.length === 0) return null;
    
    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
          {bucketName === 'Dream' && <Navigation className="text-purple-400 h-5 w-5" />}
          {bucketName === 'Moderate' && <Navigation className="text-amber-400 h-5 w-5" />}
          {bucketName === 'Safe' && <Navigation className="text-emerald-400 h-5 w-5" />}
          {bucketName} Colleges
        </h3>

        {result?.explanations && result.explanations[bucketName] && (
          <div className="mb-4 bg-indigo-950/20 border border-indigo-900/50 p-4 rounded-md">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
              <Bot className="h-4 w-4" /> AI Explanation
            </div>
            <div className="text-sm text-slate-300 prose prose-invert max-w-none">
              <ReactMarkdown>{result.explanations[bucketName] as string}</ReactMarkdown>
            </div>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(rec => (
            <Card key={rec.id} className="bg-slate-900 border-slate-800 flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-md text-white">{rec.college_name}</CardTitle>
                  <Badge variant="outline" className="bg-slate-950 text-slate-300 whitespace-nowrap">
                    {rec.college_code}
                  </Badge>
                </div>
                <CardDescription className="text-slate-400 font-mono text-xs">
                  {rec.branch_name} ({rec.branch_code})
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between pt-2">
                <div className="mb-4">
                  <div className="text-3xl font-bold text-white mb-1">
                    {rec.closing_rank}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">
                    Historical Cutoff ({rec.year})
                  </div>
                  <p className="text-sm text-slate-400 mt-3 bg-slate-950 p-2 rounded-md border border-slate-800/50">
                    {rec.reason}
                  </p>
                </div>
                
                <div className="pt-3 border-t border-slate-800/50 flex flex-wrap gap-2">
                  {rec.verified_flag ? (
                    <Badge variant="outline" className="bg-emerald-950/30 text-emerald-400 border-emerald-900 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Verified Data
                    </Badge>
                  ) : rec.source_type === 'forecast' ? (
                    <Badge variant="outline" className="bg-indigo-950/30 text-indigo-400 border-indigo-900 gap-1">
                      <AlertCircle className="h-3 w-3" /> Forecast Data
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-950/30 text-amber-400 border-amber-900 gap-1">
                      <AlertCircle className="h-3 w-3" /> Estimated Data
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-slate-800/50 text-slate-400 border-slate-700">
                    Confidence: {rec.confidence_score}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">ECET Recommendation Engine</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your details or expected rank to see college predictions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1 w-full">
              <label className="text-sm font-medium text-slate-300">Expected/Actual Rank</label>
              <Input 
                type="number" 
                value={rank} 
                onChange={(e) => setRank(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white"
                required
              />
            </div>
            <div className="space-y-2 flex-1 w-full">
              <label className="text-sm font-medium text-slate-300">Target Branch</label>
              <select 
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="CSE">CSE</option>
                <option value="CSM">CSM (AI & ML)</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MEC">Mechanical</option>
                <option value="CIV">Civil</option>
                <option value="ALL">All Branches</option>
              </select>
            </div>
            <div className="space-y-2 flex-1 w-full">
              <label className="text-sm font-medium text-slate-300">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="OC">OC</option>
                <option value="BC-A">BC-A</option>
                <option value="BC-B">BC-B</option>
                <option value="BC-C">BC-C</option>
                <option value="BC-D">BC-D</option>
                <option value="BC-E">BC-E</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>
            <div className="space-y-2 flex-1 w-full">
              <label className="text-sm font-medium text-slate-300">Gender</label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="General">General (Boys/Girls)</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-indigo-600 text-white hover:bg-indigo-700 w-full md:w-auto h-10"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Analyze"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && result.recommendations.length === 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-10 text-center">
            <p className="text-slate-400">No data found for this combination. Try broadening your search.</p>
          </CardContent>
        </Card>
      )}

      {result && result.recommendations.length > 0 && (
        <div className="space-y-2">
          {renderBucket('Dream', result.recommendations.filter(r => r.bucket === 'Dream'))}
          {renderBucket('Moderate', result.recommendations.filter(r => r.bucket === 'Moderate'))}
          {renderBucket('Safe', result.recommendations.filter(r => r.bucket === 'Safe'))}
        </div>
      )}
    </div>
  );
}
