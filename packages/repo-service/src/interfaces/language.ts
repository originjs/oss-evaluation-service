import type { SonarScanParam } from './param';

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
   * after scan(like rm file and clean)
   */
  afterScanCommand(): string;
}
