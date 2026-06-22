"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SBTETProvider = void 0;
const syncEngine_1 = require("./syncEngine");
const RealSBTETConnector_1 = require("./RealSBTETConnector");
/**
 * Dependency Injection Container for SBTET Services.
 *
 * In local/development environments, this returns the RealSBTETConnector.
 */
class SBTETProvider {
    /**
     * Retrieves the singleton instance of the SBTET Connector.
     * Based on environment variables, it can return either the Mock or the Real scraper.
     */
    static getConnector() {
        if (!this.connectorInstance) {
            this.connectorInstance = new RealSBTETConnector_1.RealSBTETConnector();
        }
        return this.connectorInstance;
    }
    /**
     * Retrieves the Academic Sync Engine wired up with the correct connector.
     */
    static getSyncEngine() {
        if (!this.engineInstance) {
            const connector = this.getConnector();
            this.engineInstance = new syncEngine_1.AcademicSyncEngine(connector);
        }
        return this.engineInstance;
    }
}
exports.SBTETProvider = SBTETProvider;
