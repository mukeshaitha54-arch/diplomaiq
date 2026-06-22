import { ISBTETConnector } from './connector';
import { AcademicSyncEngine } from './syncEngine';
import { RealSBTETConnector } from './RealSBTETConnector';
import { SBTETApiClient } from './SBTETApiClient';

/**
 * Dependency Injection Container for SBTET Services.
 * 
 * In local/development environments, this returns the RealSBTETConnector.
 */
export class SBTETProvider {
  private static connectorInstance: ISBTETConnector;
  private static engineInstance: AcademicSyncEngine;
  private static apiClientInstance: SBTETApiClient;

  /**
   * Retrieves the primary API Client for SBTET operations.
   */
  static getApiClient(): SBTETApiClient {
    if (!this.apiClientInstance) {
      this.apiClientInstance = new SBTETApiClient();
    }
    return this.apiClientInstance;
  }

  /**
   * Retrieves the singleton instance of the SBTET Connector (Fallback Playwright).
   */
  static getConnector(): ISBTETConnector {
    if (!this.connectorInstance) {
      this.connectorInstance = new RealSBTETConnector();
    }
    return this.connectorInstance;
  }

  /**
   * Retrieves the Academic Sync Engine wired up with the correct connector.
   */
  static getSyncEngine(): AcademicSyncEngine {
    if (!this.engineInstance) {
      const connector = this.getConnector();
      this.engineInstance = new AcademicSyncEngine(connector);
    }
    return this.engineInstance;
  }
}
