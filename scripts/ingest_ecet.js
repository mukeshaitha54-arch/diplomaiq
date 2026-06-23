import { createAdminClient } from '@insforge/sdk';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeApiKey = process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
const adminClient = createAdminClient({
  baseUrl: insforgeUrl,
  apiKey: insforgeApiKey,
});

async function run() {
  console.log("Starting ECET Data Ingestion...");
  console.log("Clearing existing data...");
  await adminClient.database.from('ecet_cutoffs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // 1. Ingest Historical Cutoffs
  const histPath = path.join(process.cwd(), 'data', 'ecet_cutoffs.json');
  if (fs.existsSync(histPath)) {
    console.log("Reading historical cutoffs...");
    const rawData = JSON.parse(fs.readFileSync(histPath, 'utf8'));
    
    // Map data to schema
    const mappedHist = rawData.map((d) => ({
      year: d.year,
      round: d.round,
      college_code: d.college_code,
      college_name: d.college_name,
      branch_code: d.branch_code,
      branch_name: d.branch_name,
      category: d.category,
      gender: d.gender,
      closing_rank: d.closing_rank,
      source: 'synthesized_baseline',
      source_type: 'estimated',
      confidence_score: 80.0,
      verified_flag: false
    }));

    console.log(`Inserting ${mappedHist.length} historical records...`);
    // Insert in chunks of 500
    for (let i = 0; i < mappedHist.length; i += 500) {
      const chunk = mappedHist.slice(i, i + 500);
      const { error } = await adminClient.database.from('ecet_cutoffs').insert(chunk);
      if (error) {
        console.error("Error inserting historical chunk:", error);
      } else {
        process.stdout.write(`Inserted ${i + chunk.length}/${mappedHist.length}\r`);
      }
    }
    console.log("\nHistorical data insertion complete.");
  }

  // 2. Ingest Forecasts
  const forecastPath = path.join(process.cwd(), 'data', 'ecet_forecasts.csv');
  if (fs.existsSync(forecastPath)) {
    console.log("Reading forecasts...");
    const rawCsv = fs.readFileSync(forecastPath, 'utf8');
    const records = parse(rawCsv, { columns: true, skip_empty_lines: true });

    const mappedForecasts = records.map((d) => ({
      year: 2026,
      round: 1, // Forecast usually predicts round 1 or final
      college_code: d.college_code,
      college_name: d.college_code, // Missing in CSV
      branch_code: d.branch_code,
      branch_name: d.branch_code, // Missing in CSV
      category: d.category,
      gender: d.gender,
      closing_rank: Math.round(parseFloat(d.predicted_closing_rank)),
      source: 'diplomaiq_wha_model',
      source_type: 'forecast',
      confidence_score: parseFloat(d.confidence_score),
      verified_flag: false
    }));

    console.log(`Inserting ${mappedForecasts.length} forecast records...`);
    for (let i = 0; i < mappedForecasts.length; i += 500) {
      const chunk = mappedForecasts.slice(i, i + 500);
      const { error } = await adminClient.database.from('ecet_cutoffs').insert(chunk);
      if (error) {
        console.error("Error inserting forecast chunk:", error);
      } else {
        process.stdout.write(`Inserted ${i + chunk.length}/${mappedForecasts.length}\r`);
      }
    }
    console.log("\nForecast data insertion complete.");
  }
}

run().catch(console.error);
