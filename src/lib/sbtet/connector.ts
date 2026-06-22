import { SBTETStudentInfo, SBTETAttendance, SBTETResult, SBTETConsolidatedResult } from './models';
import { 
  InvalidPINError, 
  SBTETServerDownError, 
  SBTETTimeoutError, 
  CaptchaDetectedError 
} from './errors';

/**
 * Interface defining the contract for communicating with the SBTET portal.
 * Actual implementation requires a headless browser (Puppeteer) or HTML parser (Cheerio)
 * to scrape the data, as no REST API exists.
 */
export interface ISBTETConnector {
  /**
   * Verifies the PIN exists and retrieves basic student details.
   * Throws InvalidPINError if not found.
   */
  verifyStudent(pin: string, scheme: string): Promise<SBTETStudentInfo>;

  /**
   * Fetches real-time attendance for the student across all registered semesters.
   */
  fetchAttendance(pin: string): Promise<SBTETAttendance[]>;

  /**
   * Fetches the Captcha image and session cookies for attendance tracking.
   */
  fetchAttendanceCaptcha?(): Promise<{ base64: string; cookies: string }>;

  /**
   * Submits the Captcha to fetch attendance.
   */
  fetchAttendanceWithCaptcha?(pin: string, captchaText: string, cookies: string): Promise<SBTETAttendance[]>;

  /**
   * Fetches results for a specific semester.
   */
  fetchResults(pin: string, semester: number, scheme: string): Promise<SBTETResult>;

  /**
   * Fetches the consolidated results encompassing all available semesters.
   */
  fetchConsolidatedResults(pin: string, scheme: string): Promise<SBTETConsolidatedResult>;
}

// MockSBTETConnector has been removed.
// All code must use RealSBTETConnector. If SBTET scraping fails, errors propagate – no fallback.
