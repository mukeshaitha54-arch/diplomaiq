import { ISBTETConnector } from './connector';
import { SBTETStudentInfo, SBTETAttendance, SBTETResult, SBTETConsolidatedResult } from './models';
import { NoResultsAvailableError, SBTETTimeoutError, SBTETServerDownError, SBTETError } from './errors';

export class RealSBTETConnector implements ISBTETConnector {

  async verifyStudent(pin: string, scheme: string): Promise<SBTETStudentInfo> {
    throw new Error('Playwright connector disabled for production deployment.');
  }

  async fetchAttendance(pin: string): Promise<SBTETAttendance[]> {
    try {
      const url = `https://sbtet.telangana.gov.in/api/api/PreExamination/getAttendanceReport?Pin=${pin}`;
      const res = await fetch(url, { cache: 'no-store' });
      
      const rawText = await res.text();
      if (!res.ok || rawText.includes("404") || rawText.includes("<html")) {
        return [];
      }

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        return [];
      }

      if (!data || !data.Table || data.Table.length === 0) {
        throw new NoResultsAvailableError(pin);
      }

      return data.Table.map((row: any) => ({
        pin,
        semester: parseInt(row.Sem),
        totalWorkingDays: parseInt(row.WorkingDays),
        daysPresent: parseInt(row.PresentDays),
        attendancePercentage: parseFloat(row.Percentage),
        lastUpdated: new Date()
      }));

    } catch (e: any) {
      if (e instanceof SBTETError) throw e;
      throw new SBTETTimeoutError('fetch attendance');
    }
  }

  async fetchResults(pin: string, semester: number, scheme: string): Promise<SBTETResult> {
    throw new Error('Playwright connector disabled for production deployment.');
  }

  async fetchConsolidatedResults(pin: string, scheme: string): Promise<SBTETConsolidatedResult> {
    throw new Error('Playwright connector disabled for production deployment.');
  }
}

