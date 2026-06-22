import { SBTETStudentInfo, SBTETAttendance, SBTETConsolidatedResult, SBTETSubjectResult, SBTETResult } from './models';
import { NoResultsAvailableError, SBTETServerDownError, SBTETError } from './errors';

export interface ApiConsolidatedResponse {
  Table: {
    CenterCode: string;
    CenterName: string;
    Pin: string;
    StudentName: string;
    BranchCode: string;
    Scheme: string;
  }[];
  Table1: {
    TotalMaxCredits: number;
    CreditsGained: number;
    CgpaTotalGained: number;
    CgpaTotalCredits: number;
    CGPA: number;
  }[];
  Table2: {
    Branch_Code: string;
    pin: string;
    ExamMonthYear: string;
    Subject_Code: string;
    SubjectName: string;
    MaxCredits: number;
    InternalMarks: string;
    EndExamMarks: string;
    HybridGrade: string;
    GradePoint: number;
    Semester: string;
    CreditsGained: number;
    ExamStatus: string;
    TotalGradePoints: number;
    SemId: number;
  }[];
  Table3: {
    SemId: number;
    Semester: string;
    TotalGradePoints: number;
    Credits: number;
    SGPA: number | null;
  }[];
}

export interface ApiAttendanceResponse {
  Table: {
    semid: number;
    Pin: string;
    TotalPercentage: number;
    TotalWorkingDays: number;
    Name: string;
    AttendeeId: string;
    CollegeCode: string;
    Scheme: string;
    Semester: string;
    BranchCode: string;
    NumberOfDaysPresent: number;
    WorkingDays: number;
    Percentage: number;
    UpdatedDate: string;
  }[];
}

export class SBTETApiClient {
  private async fetchWithRetry(url: string): Promise<string> {
    const https = await import('https');
    return new Promise((resolve, reject) => {
      const req = https.get(url, { rejectUnauthorized: false }, (res) => {
        if (res.statusCode !== 200) {
          console.error(`SBTET API returned status code ${res.statusCode} for ${url}`);
          resolve(''); // Will trigger the 404/down logic
          return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      
      req.setTimeout(8000, () => {
        req.destroy(new Error('Connection timed out after 8 seconds. SBTET might be blocking the server.'));
      });

      req.on('error', (e) => {
        console.error('HTTPS request error:', e);
        reject(e);
      });
      req.end();
    });
  }

  async getConsolidatedResults(pin: string): Promise<ApiConsolidatedResponse> {
    try {
      const url = `https://sbtet.telangana.gov.in/api/api/Results/GetConsolidatedResults?Pin=${pin}`;
      const rawText = await this.fetchWithRetry(url);
      
      if (!rawText) {
        throw new SBTETServerDownError(503);
      }

      let parsedData;
      try {
        parsedData = JSON.parse(rawText);
        if (typeof parsedData === 'string') {
          parsedData = JSON.parse(parsedData);
        }
      } catch (e) {
        throw new SBTETServerDownError(500);
      }

      if (!parsedData || !parsedData.Table || parsedData.Table.length === 0) {
        throw new NoResultsAvailableError(pin);
      }

      return parsedData as ApiConsolidatedResponse;
    } catch (e: any) {
      if (e instanceof SBTETError) throw e;
      throw new SBTETError(e.message);
    }
  }

  async verifyStudent(pin: string): Promise<SBTETStudentInfo> {
    const data = await this.getConsolidatedResults(pin);
    const info = data.Table[0];
    
    return {
      pin: info.Pin,
      fullName: info.StudentName.trim(),
      branchCode: info.BranchCode,
      branchName: info.BranchCode, // API doesn't provide full branch name directly
      collegeCode: info.CenterCode,
      collegeName: info.CenterName.trim(),
      scheme: info.Scheme
    };
  }

  async getAttendanceReport(pin: string): Promise<ApiAttendanceResponse> {
    try {
      const url = `https://sbtet.telangana.gov.in/api/api/PreExamination/getAttendanceReport?Pin=${pin}`;
      const rawText = await this.fetchWithRetry(url);
      
      if (!rawText) {
        return { Table: [] };
      }

      let parsedData;
      try {
        parsedData = JSON.parse(rawText);
        if (typeof parsedData === 'string') {
          parsedData = JSON.parse(parsedData);
        }
      } catch (e) {
        return { Table: [] };
      }

      if (!parsedData || !parsedData.Table) {
        return { Table: [] };
      }

      return parsedData as ApiAttendanceResponse;
    } catch (e: any) {
      if (e instanceof SBTETError) throw e;
      throw new SBTETError(`Failed to fetch attendance: ${e.message}`);
    }
  }
}
