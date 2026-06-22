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
  private getFastApiUrl(): string {
    return process.env.FASTAPI_URL || 'https://optimistic-spirit-production-00a1.up.railway.app';
  }

  private async fetchFromGateway(endpoint: string, pin: string): Promise<any> {
    const url = `${this.getFastApiUrl()}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      if (!response.ok) {
        if (response.status === 504) {
          throw new SBTETError('Connection to SBTET timed out. The server might be down or blocking requests.');
        }
        const text = await response.text();
        throw new SBTETError(`Gateway error (${response.status}): ${text}`);
      }

      return await response.json();
    } catch (e: any) {
      if (e instanceof SBTETError) throw e;
      throw new SBTETError(`Failed to connect to SBTET Gateway: ${e.message}`);
    }
  }

  async getConsolidatedResults(pin: string): Promise<ApiConsolidatedResponse> {
    try {
      const parsedData = await this.fetchFromGateway('/academic-results', pin);
      
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
      const parsedData = await this.fetchFromGateway('/attendance', pin);

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
