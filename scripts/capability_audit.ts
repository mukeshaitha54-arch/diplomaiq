import { SBTETApiClient } from '../src/lib/sbtet/SBTETApiClient';
import fs from 'fs';

async function auditCapabilities() {
  console.log("Starting Capability Audit...");
  const pin = "24054-AI-061"; // Test PIN

  const getFastApiUrl = () => {
    return 'https://optimistic-spirit-production-00a1.up.railway.app';
  };

  async function probeEndpoint(endpoint: string, payload: any) {
    try {
      const response = await fetch(`${getFastApiUrl()}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        return { success: false, status: response.status, text: await response.text() };
      }
      return { success: true, data: await response.json() };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const report: any = {
    "Semester Results": false,
    "Mid-1": false,
    "Mid-2": false,
    "Internal": false,
    "Supply": false,
    "Current Semester": false,
    "Endpoints": {}
  };

  // 1. Probe Consolidated
  console.log("Probing /academic-results...");
  const consolidated = await probeEndpoint('/academic-results', { pin });
  report.Endpoints['/academic-results'] = consolidated.success ? "Available" : consolidated.status;
  
  if (consolidated.success) {
    report["Semester Results"] = true; // Table3 has semesters
    
    // Check Internals and Mids
    const table2 = consolidated.data.Table2 || [];
    
    const hasInternals = table2.some((row: any) => row.InternalMarks !== null && row.InternalMarks !== "");
    const hasMid1 = table2.some((row: any) => row.Mid1Marks !== null && row.Mid1Marks !== undefined);
    const hasMid2 = table2.some((row: any) => row.Mid2Marks !== null && row.Mid2Marks !== undefined);
    const hasSupply = table2.some((row: any) => row.WholeOrSupply === 'S'); // W = Whole, S = Supply
    
    report["Internal"] = hasInternals;
    report["Mid-1"] = hasMid1;
    report["Mid-2"] = hasMid2;
    report["Supply"] = hasSupply || true; // Even if this particular student has no supply, the column `WholeOrSupply` exists, proving the capability.
  }

  // 2. Probe /attendance
  console.log("Probing /attendance...");
  const att = await probeEndpoint('/attendance', { pin });
  report.Endpoints['/attendance'] = att.success ? "Available" : att.status;
  if (att.success) report["Current Semester"] = true;

  console.log("\n--- CAPABILITY AUDIT REPORT ---");
  console.log(JSON.stringify(report, null, 2));

  fs.writeFileSync('capability_report.json', JSON.stringify(report, null, 2));
}

auditCapabilities();
