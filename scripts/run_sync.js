"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sbtet_1 = require("../src/lib/actions/sbtet");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.local' });
const profileId = '45d4dbb3-5846-4317-9f75-fe745cfe165c';
const pin = '24054-AI-061';
async function main() {
    console.log('Starting sync for PIN:', pin);
    console.log('1. Fetching Semester 1 results...');
    const result = await (0, sbtet_1.syncSemesterAction)(profileId, pin, 1);
    if (!result.success) {
        console.error('Failed to sync semester:', result.error);
        return;
    }
    console.log('Semester 1 synced successfully!');
    console.log('2. Recalculating Academic Summary...');
    const summary = await (0, sbtet_1.recalculateAcademicSummaryAction)(profileId);
    if (!summary.success) {
        console.error('Failed to update summary:', summary.error);
        return;
    }
    console.log('Summary calculated!');
    console.log('Done.');
}
main();
