"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SBTETTimeoutError = exports.SBTETServerDownError = exports.SessionExpiredError = exports.CaptchaDetectedError = exports.NoResultsAvailableError = exports.InvalidPINError = exports.SBTETError = void 0;
class SBTETError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SBTETError';
    }
}
exports.SBTETError = SBTETError;
class InvalidPINError extends SBTETError {
    constructor(pin) {
        super(`Invalid PIN provided: ${pin}. Ensure format is correct (e.g., 23001-CM-001)`);
        this.name = 'InvalidPINError';
    }
}
exports.InvalidPINError = InvalidPINError;
class NoResultsAvailableError extends SBTETError {
    constructor(identifier) {
        super(`No results found or published yet for: ${identifier}.`);
        this.name = 'NoResultsAvailableError';
    }
}
exports.NoResultsAvailableError = NoResultsAvailableError;
class CaptchaDetectedError extends SBTETError {
    constructor() {
        super('A CAPTCHA challenge blocked the request. Manual intervention or advanced bypass required.');
        this.name = 'CaptchaDetectedError';
    }
}
exports.CaptchaDetectedError = CaptchaDetectedError;
class SessionExpiredError extends SBTETError {
    constructor() {
        super('The SBTET session has expired. A re-authentication flow is required.');
        this.name = 'SessionExpiredError';
    }
}
exports.SessionExpiredError = SessionExpiredError;
class SBTETServerDownError extends SBTETError {
    constructor(statusCode) {
        super(`The SBTET portal is currently unreachable or down. Status: ${statusCode || 'Unknown'}`);
        this.name = 'SBTETServerDownError';
    }
}
exports.SBTETServerDownError = SBTETServerDownError;
class SBTETTimeoutError extends SBTETError {
    constructor(operation) {
        super(`Timeout exceeded while attempting to ${operation} from SBTET portal.`);
        this.name = 'SBTETTimeoutError';
    }
}
exports.SBTETTimeoutError = SBTETTimeoutError;
