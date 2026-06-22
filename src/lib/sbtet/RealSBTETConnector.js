"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealSBTETConnector = void 0;
const playwright_1 = require("playwright");
const errors_1 = require("./errors");
class RealSBTETConnector {
    /**
     * Helper to perform the dynamic dropdown selection logic on the Results page.
     */
    async selectResultDropdowns(page, scheme, semester, passType = 'Regular') {
        try {
            // Scheme
            await page.selectOption('select[ng-model="SelectedScheme"]', { label: scheme }).catch(() => page.selectOption('select[ng-model="StudentResult.Scheme"]', { label: scheme }).catch(() => page.locator('select').nth(0).selectOption({ label: scheme }) // Fallback by index based on screenshot
            ));
            await page.waitForTimeout(500); // Wait for angular digest and network
            // Exam Pass Type
            await page.locator('select').nth(1).selectOption({ label: passType });
            await page.waitForTimeout(500);
            // Sem & Year
            await page.locator('select').nth(2).selectOption({ label: `${semester}SEM` });
            await page.waitForTimeout(500);
            // Exam
            await page.locator('select').nth(3).selectOption({ label: 'Semester' });
            await page.waitForTimeout(1000); // Longer wait for the dynamic Month/Year load
            // Exam Month/Year (Select the first/latest available)
            const monthYearSelect = page.locator('select').nth(4);
            const options = await monthYearSelect.locator('option').allInnerTexts();
            if (options.length > 1) {
                // Option 0 is usually 'Select', Option 1 is the latest
                await monthYearSelect.selectOption({ label: options[1].trim() });
            }
        }
        catch (e) {
            throw new Error(`Failed to interact with dropdowns: ${e.message}`);
        }
    }
    async verifyStudent(pin) {
        const browser = await playwright_1.chromium.launch({ headless: true });
        const page = await browser.newPage();
        try {
            await page.goto('https://sbtet.telangana.gov.in/index.html#!/index/DiplomaStudentResult', { waitUntil: 'networkidle' });
            // Try to find the student by testing C24 and C21 schemes.
            const schemesToTry = ['C24', 'C21', 'C18'];
            for (const scheme of schemesToTry) {
                await page.reload({ waitUntil: 'networkidle' });
                await this.selectResultDropdowns(page, scheme, 1, 'Regular');
                await page.fill('input[placeholder="Pin Number"]', pin).catch(() => page.locator('input[type="text"]').last().fill(pin));
                await page.click('button:has-text("Get Report")');
                await page.waitForTimeout(2000);
                // Check if table loaded
                const hasTable = await page.locator('table').count();
                if (hasTable > 0) {
                    // Extract Student Info
                    const name = await page.locator('table').first().locator('tr').nth(1).locator('td').nth(1).innerText();
                    const branch = await page.locator('table').first().locator('tr').nth(1).locator('td').nth(2).innerText();
                    const collegeCode = await page.locator('table').first().locator('tr').nth(3).locator('td').nth(0).innerText();
                    const collegeName = await page.locator('table').first().locator('tr').nth(3).locator('td').nth(1).innerText();
                    return {
                        pin: pin.toUpperCase(),
                        fullName: name.trim(),
                        branchCode: branch.trim(),
                        branchName: branch.trim(),
                        collegeCode: collegeCode.trim(),
                        collegeName: collegeName.trim(),
                        scheme: scheme
                    };
                }
            }
            throw new errors_1.NoResultsAvailableError(pin);
        }
        catch (e) {
            if (e instanceof errors_1.NoResultsAvailableError)
                throw e;
            throw new errors_1.SBTETServerDownError(e.message);
        }
        finally {
            await browser.close();
        }
    }
    async fetchAttendance(pin) {
        try {
            const url = `https://sbtet.telangana.gov.in/api/api/PreExamination/getAttendanceReport?Pin=${pin}`;
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) {
                throw new errors_1.SBTETServerDownError(res.status);
            }
            const rawText = await res.text();
            let data;
            try {
                data = JSON.parse(rawText);
            }
            catch (e) {
                throw new errors_1.NoResultsAvailableError(pin);
            }
            if (!data || !data.Table || data.Table.length === 0) {
                throw new errors_1.NoResultsAvailableError(pin);
            }
            const studentData = data.Table[0];
            // Calculate working days based on SBTET logic
            let workingDays = 90;
            if (studentData.semid == 8 || studentData.semid == 9) {
                workingDays = 180;
            }
            const attendancePercentage = Number(((studentData.NumberOfDaysPresent / studentData.ExamsWorkingDays) * 100).toFixed(2));
            return [
                {
                    pin: studentData.Pin,
                    semester: studentData.semid || 1, // Fallback if semid is not present
                    totalWorkingDays: studentData.ExamsWorkingDays || workingDays,
                    daysPresent: studentData.NumberOfDaysPresent || 0,
                    attendancePercentage: isNaN(attendancePercentage) ? 0 : attendancePercentage,
                    lastUpdated: new Date()
                }
            ];
        }
        catch (e) {
            if (e instanceof errors_1.SBTETError)
                throw e;
            throw new errors_1.SBTETTimeoutError('fetch attendance');
        }
    }
    async fetchResults(pin, semester) {
        const browser = await playwright_1.chromium.launch({ headless: true });
        const page = await browser.newPage();
        try {
            await page.goto('https://sbtet.telangana.gov.in/index.html#!/index/DiplomaStudentResult', { waitUntil: 'networkidle' });
            // We will assume C24 for 2024 pins, else C21 for 2021-2023 pins as a heuristic
            const yearPrefix = parseInt(pin.substring(0, 2));
            const scheme = yearPrefix >= 24 ? 'C24' : (yearPrefix >= 21 ? 'C21' : 'C18');
            await this.selectResultDropdowns(page, scheme, semester, 'Regular');
            await page.locator('input[type="text"]').last().fill(pin);
            await page.click('button:has-text("Get Report")');
            await page.waitForTimeout(2000);
            const hasTable = await page.locator('table').count();
            if (hasTable === 0) {
                throw new errors_1.NoResultsAvailableError(pin);
            }
            // Parse the results table
            // In the screenshot, the subjects table is the second table in the DOM
            const subjectsTable = page.locator('table').nth(1);
            const rows = await subjectsTable.locator('tr').all();
            const subjects = [];
            let totalPoints = 0;
            let isPassed = true;
            // Skip header rows (usually first 2 rows)
            for (let i = 2; i < rows.length - 3; i++) { // skip bottom totals rows
                const cols = await rows[i].locator('td').allInnerTexts();
                if (cols.length < 9)
                    continue;
                const subjectCode = cols[0].trim();
                const subjectName = cols[1].trim();
                const credits = parseFloat(cols[2].trim());
                const internal = parseInt(cols[5].trim()); // Based on screenshot index
                const endSem = parseInt(cols[6].trim());
                const total = parseInt(cols[7].trim());
                const grade = cols[8].trim();
                const gradePoints = parseFloat(cols[9].trim());
                if (grade === 'F' || grade === 'Fail')
                    isPassed = false;
                subjects.push({
                    subjectCode,
                    subjectName,
                    internalMarks: internal,
                    externalMarks: endSem,
                    totalMarks: total,
                    credits,
                    grade,
                    resultStatus: grade === 'F' ? 'F' : 'P'
                });
            }
            // Extract SGPA from the bottom row
            const sgpaRowText = await rows[rows.length - 2].innerText();
            const sgpaMatch = sgpaRowText.match(/(\d+\.?\d*)\s*$/);
            const sgpa = sgpaMatch ? parseFloat(sgpaMatch[1]) : 0;
            return {
                pin,
                semester,
                sgpa,
                totalCreditsEarned: isPassed ? 20 : 0, // Simplified
                isPassed,
                publishedDate: new Date(),
                subjects
            };
        }
        finally {
            await browser.close();
        }
    }
    async fetchConsolidatedResults(pin) {
        const results = {};
        const r1 = await this.fetchResults(pin, 1).catch(() => null);
        if (!r1)
            throw new errors_1.NoResultsAvailableError(pin);
        results[1] = r1;
        return {
            pin,
            cgpa: r1.sgpa, // Simplified for 1 semester
            totalBacklogs: r1.isPassed ? 0 : 1,
            completedSemesters: [1],
            results
        };
    }
}
exports.RealSBTETConnector = RealSBTETConnector;
