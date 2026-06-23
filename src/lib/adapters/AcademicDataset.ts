export interface AssessmentSubject {
  subjectCode: string;
  subjectName: string;
  marks: number;
  maxMarks: number;
  grade: string;
  isFailed: boolean;
}

export interface AssessmentPeriod {
  periodNumber: number;
  periodScore: number;
  isPassed: boolean;
  subjects: AssessmentSubject[];
  publishedDate?: string;
}

export interface AcademicDataset {
  type: 'semester' | 'mid1' | 'mid2' | 'internal';
  labels: {
    aggregate: string;
    period: string;
  };
  summary: {
    aggregateScore: number;
    totalFailedSubjects: number;
    strongSubjects: string[];
    weakSubjects: string[];
    lastCalculatedAt: string;
  };
  periods: AssessmentPeriod[];
}
