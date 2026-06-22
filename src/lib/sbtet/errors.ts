export class SBTETError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SBTETError';
  }
}

export class InvalidPINError extends SBTETError {
  constructor(pin: string) {
    super(`Invalid PIN provided: ${pin}. Ensure format is correct (e.g., 23001-CM-001)`);
    this.name = 'InvalidPINError';
  }
}

export class NoResultsAvailableError extends SBTETError {
  constructor(identifier: number | string) {
    super(`No results found or published yet for: ${identifier}.`);
    this.name = 'NoResultsAvailableError';
  }
}

export class CaptchaDetectedError extends SBTETError {
  constructor() {
    super('A CAPTCHA challenge blocked the request. Manual intervention or advanced bypass required.');
    this.name = 'CaptchaDetectedError';
  }
}

export class SessionExpiredError extends SBTETError {
  constructor() {
    super('The SBTET session has expired. A re-authentication flow is required.');
    this.name = 'SessionExpiredError';
  }
}

export class SBTETServerDownError extends SBTETError {
  constructor(statusCode?: number) {
    super(`The SBTET portal is currently unreachable or down. Status: ${statusCode || 'Unknown'}`);
    this.name = 'SBTETServerDownError';
  }
}

export class SBTETTimeoutError extends SBTETError {
  constructor(operation: string) {
    super(`Timeout exceeded while attempting to ${operation} from SBTET portal.`);
    this.name = 'SBTETTimeoutError';
  }
}
