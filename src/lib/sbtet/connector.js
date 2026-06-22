"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockSBTETConnector = void 0;
const errors_1 = require("./errors");
/**
 * Mock implementation of ISBTETConnector for local development and UI testing
 * before the actual scraping infrastructure is deployed.
 */
class MockSBTETConnector {
    async verifyStudent(pin) {
        if (!pin.match(/^\d{5}-[A-Z]{2}-\d{3}$/i)) {
            throw new errors_1.InvalidPINError(pin);
        }
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
            pin: pin.toUpperCase(),
            fullName: "JOHN DOE",
            branchCode: "CM",
            branchName: "Computer Engineering",
            collegeCode: "001",
            collegeName: "Government Polytechnic",
            scheme: "C21"
        };
    }
    async fetchAttendance(pin) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return [
            {
                pin,
                semester: 5,
                totalWorkingDays: 90,
                daysPresent: 69,
                attendancePercentage: 76.6,
                lastUpdated: new Date()
            }
        ];
    }
    async fetchResults(pin, semester) {
        await new Promise(resolve => setTimeout(resolve, 1200));
        return {
            pin,
            semester,
            sgpa: 8.45,
            totalCreditsEarned: 24,
            isPassed: true,
            publishedDate: new Date('2023-11-15'),
            subjects: [
                {
                    subjectCode: 'CM-501',
                    subjectName: 'Industrial Management',
                    internalMarks: 18,
                    externalMarks: 65,
                    totalMarks: 83,
                    credits: 3,
                    grade: 'A',
                    resultStatus: 'P'
                }
            ]
        };
    }
    async fetchConsolidatedResults(pin) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const results = {};
        const r1 = await this.fetchResults(pin, 1);
        results[1] = r1;
        return {
            pin,
            cgpa: 8.45,
            totalBacklogs: 1,
            completedSemesters: [1],
            results
        };
    }
}
exports.MockSBTETConnector = MockSBTETConnector;
