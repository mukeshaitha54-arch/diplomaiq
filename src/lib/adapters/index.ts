import { AcademicDataset, AssessmentPeriod, AssessmentSubject } from './AcademicDataset';

export class SemesterAdapter {
  /**
   * Adapts existing `semesters`, `subjects`, and `academic_summary` into an AcademicDataset.
   */
  static adapt(
    summaryRecord: any,
    semesterRecords: any[],
    subjectRecords: any[]
  ): AcademicDataset {
    
    const periods: AssessmentPeriod[] = semesterRecords.map(sem => {
      // Find subjects for this semester
      const semSubjects = subjectRecords.filter(s => s.semester_id === sem.id);
      
      const subjects: AssessmentSubject[] = semSubjects.map(s => ({
        subjectCode: s.subject_code,
        subjectName: s.subject_name,
        marks: s.total_marks || 0,
        maxMarks: 100, // Typically 100 for finals
        grade: s.grade,
        isFailed: s.is_backlog || s.result_status === 'F'
      }));

      return {
        periodNumber: sem.semester_number,
        periodScore: sem.sgpa || 0,
        isPassed: sem.is_passed !== false,
        subjects,
        publishedDate: sem.published_date
      };
    });

    return {
      type: 'semester',
      labels: {
        aggregate: 'CGPA',
        period: 'SGPA'
      },
      summary: {
        aggregateScore: summaryRecord?.cgpa || 0,
        totalFailedSubjects: summaryRecord?.total_backlogs || 0,
        strongSubjects: summaryRecord?.strong_subjects || [],
        weakSubjects: summaryRecord?.weak_subjects || [],
        lastCalculatedAt: summaryRecord?.last_calculated_at || new Date().toISOString()
      },
      periods
    };
  }
}

export class MidAdapter {
  /**
   * Adapts new `assessment_instances`, `assessment_subjects`, and `assessment_summaries` into an AcademicDataset.
   */
  static adapt(
    type: 'mid1' | 'mid2' | 'internal',
    summaryRecord: any,
    instanceRecords: any[],
    subjectRecords: any[]
  ): AcademicDataset {
    
    const periods: AssessmentPeriod[] = instanceRecords.map(inst => {
      const instSubjects = subjectRecords.filter(s => s.assessment_instance_id === inst.id);
      
      const subjects: AssessmentSubject[] = instSubjects.map(s => ({
        subjectCode: s.subject_code,
        subjectName: s.subject_name,
        marks: s.marks_obtained || 0,
        maxMarks: s.max_marks || 20, // Typical for mids
        grade: s.grade || '',
        isFailed: s.is_failed
      }));

      return {
        periodNumber: inst.semester_number,
        periodScore: inst.performance_index || 0,
        isPassed: !subjects.some(s => s.isFailed),
        subjects,
        publishedDate: inst.created_at
      };
    });

    return {
      type,
      labels: {
        aggregate: 'Overall Average',
        period: 'Performance Index'
      },
      summary: {
        aggregateScore: summaryRecord?.aggregate_score || 0,
        totalFailedSubjects: summaryRecord?.total_failed_subjects || 0,
        strongSubjects: summaryRecord?.strong_subjects || [],
        weakSubjects: summaryRecord?.weak_subjects || [],
        lastCalculatedAt: summaryRecord?.last_calculated_at || new Date().toISOString()
      },
      periods
    };
  }
}
