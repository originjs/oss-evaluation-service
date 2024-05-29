import type { SonarScanParam } from './Param';

/**
 * each language sonar scanner impl
 */
export interface LanguageSonarScannerInterface {
  param: SonarScanParam;
  /**
   * get the sonar command by param
   */
  sonarCommands(): string[];

  /**
   * after run handler(like clean,restore...)
   */
  restoreCommand(): string;
}
