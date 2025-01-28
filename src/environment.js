/**
 * Enum for Environment Types
 */
const EnvironmentType = {
  BROWSER: 0,
  NODE: 1,
  BOTH_FEATURES: 2,
  UNKNOWN: 3
};

/**
 * Environment class detects the runtime environment
 */
class Environment {
  static environmentType = EnvironmentType.UNKNOWN;

  /**
   * Determines the runtime environment
   */
  static checkEnvironment() {
    const isBrowser = typeof window !== 'undefined' && typeof global.window.document !== 'undefined';
    const isNode = typeof global !== 'undefined' &&
      typeof global.process !== 'undefined' &&
      global.process.versions &&
      global.process.versions.node;

    if (isBrowser && isNode) {
      // Environment might be something like Electron
      console.log('This environment has features of both Node.js and a web browser.');
      this.environmentType = EnvironmentType.BOTH_FEATURES;
    } else if (isNode) {
      this.environmentType = EnvironmentType.NODE;
    } else if (isBrowser) {
      this.environmentType = EnvironmentType.BROWSER;
    } else {
      console.log('ENVIRONMENT === unknown');
      this.environmentType = EnvironmentType.UNKNOWN;
    }
  }
}

// Exporting the EnvironmentType and Environment class
export { EnvironmentType, Environment as default };
