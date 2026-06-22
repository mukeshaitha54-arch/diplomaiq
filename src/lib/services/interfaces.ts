export interface SBTETStudentInfo {
  pin: string;
  studentName: string;
  branch: string;
}

export interface SBTETSightings {
  attendancePercentage: number;
  totalClasses: number;
  attendedClasses: number;
}

export interface SBTETResult {
  semester: number;
  sgpa: number | null;
  totalCredits: number;
  subjects: {
    code: string;
    name: string;
    internal: number;
    external: number;
    total: number;
    grade: string;
    credits: number;
    isBacklog: boolean;
  }[];
}

export interface ISBTETConnector {
  verifyStudent(pin: string): Promise<SBTETStudentInfo | null>;
  fetchAttendance(pin: string, semester: number): Promise<SBTETSightings>;
  fetchResults(pin: string, semester: number): Promise<SBTETResult>;
}

export interface SyncScope {
  semestersToFetch: number[];
  isFullSync: boolean;
}

export interface IAcademicSyncEngine {
  triggerSync(profileId: string, pin: string, currentSemester: number): Promise<{ syncLogId: string }>;
  processSyncQueue(): Promise<void>;
  
  // Semester-aware sync helpers
  getSemestersToFetch(currentSemester: number): number[];
  determineSyncScope(profileId: string, currentSemester: number): Promise<SyncScope>;
  
  calculateAcademicSummary(profileId: string): Promise<void>;
}

export interface INotificationEngine {
  sendAttendanceAlert(profileId: string, percentage: number): Promise<void>;
  sendBacklogWarning(profileId: string, subjectName: string): Promise<void>;
  sendSyncCompletion(profileId: string, status: 'SUCCESS' | 'FAILED', actionUrl?: string): Promise<void>;
}
