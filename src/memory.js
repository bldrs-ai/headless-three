// Assuming Environment and EnvironmentType are defined elsewhere
import Environment, {EnvironmentType} from './environment.js'


export class Memory {
  /** @return {string} - memory usage result */
  static checkMemoryUsage() {
    Environment.checkEnvironment()
    switch (Environment.environmentType) {
    case EnvironmentType.BROWSER:
      return this.checkBrowserMemory()
    case EnvironmentType.NODE:
      return this.checkNodeMemory()
    case EnvironmentType.BOTH_FEATURES:
      console.log('Checking memory usage for an environment with both Node.js and Web features.')
      return `${this.checkBrowserMemory()} ${this.checkNodeMemory()}`
    case EnvironmentType.UNKNOWN:
    default:
      return 'Unable to check memory usage: Unknown environment.'
    }
  }
  
  /**
   *
   * @return {string} - memory usage result for browser systems
   */
  static checkBrowserMemory() {
    if (window && window.performance && window.performance.memory) {
      const memoryUsage = window.performance.memory
      const usedJSHeapSize = (memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(3)
      
      return `JS heap allocated ${usedJSHeapSize} MB`
    } else {
      return 'Browser memory usage information is not available.'
    }
  }
  
  /**
   *
   * @return {string} - memory usage result for node systems
   */
  static checkNodeMemory() {
    const memoryUsage = process.memoryUsage()
    const rss = (memoryUsage.rss / 1024 / 1024).toFixed(3)
    const heapTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(3)
    const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(3)
    
    return `Node Memory Usage: RSS ${rss} MB, Heap Total: ${heapTotal} MB, Heap Used: ${heapUsed} MB`
  }
}
  

// Adding memory property to window.performance if not defined
if (typeof window !== 'undefined' && window.performance && !window.performance.memory) {
  window.performance.memory = {}
}
  
