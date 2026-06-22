export interface SBTETStudentInfo {
  pin: string;
  fullName: string;
  branchCode: string;
  branchName: string;
  collegeCode: string;
  collegeName: string;
  scheme: string;
}

export interface SBTETSubjectResult {
  subjectCode: string;
  subjectName: string;
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  credits: number;
  grade: string;
  resultStatus: 'P' | 'F' | 'A'; // Pass, Fail, Absent
}

export interface SBTETResult {
  pin: string;
  semester: number;
  sgpa: number;
  totalCreditsEarned: number;
  isPassed: boolean;
  subjects: SBTETSubjectResult[];
  publishedDate: Date;
}

export interface SBTETAttendance {
  pin: string;
  semester: number;
  totalWorkingDays: number;
  daysPresent: number;
  attendancePercentage: number;
  lastUpdated: Date;
}

export interface SBTETConsolidatedResult {
  pin: string;
  cgpa: number;
  totalBacklogs: number;
  completedSemesters: number[];
  results: Record<number, SBTETResult>; // Map of semester -> SBTETResult
}
