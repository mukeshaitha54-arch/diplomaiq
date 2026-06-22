"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminClient = exports.insforge = void 0;
const path = require('path');
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../../../.env.local');
dotenv.config({ path: envPath });
const sdk_1 = require("@insforge/sdk");
const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || '';
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || '';
const insforgeApiKey = process.env.INSFORGE_API_KEY || '';
exports.insforge = (0, sdk_1.createClient)({
    baseUrl: insforgeUrl,
    anonKey: insforgeAnonKey
});
exports.adminClient = (0, sdk_1.createAdminClient)({
    baseUrl: insforgeUrl,
    apiKey: insforgeApiKey
});
