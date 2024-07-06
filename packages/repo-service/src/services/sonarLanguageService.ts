import type { SonarScanParam } from '../interfaces/param';
import type { LanguageSonarScannerInterface } from '../interfaces/language.js';
import { JavaLanguageService } from './sonar-scanner-service/javaLanguage.js';
import { OthersLanguageService } from './sonar-scanner-service/othersLanguage.js';

export function getLanguageServiceImpl(param: SonarScanParam): LanguageSonarScannerInterface {
  const language = param.language.toUpperCase();
  switch (language) {
    case 'JAVA':
      return new JavaLanguageService(param);
    case 'C++':
    case 'C':
    case 'OBJECT-C':
    case 'C#':
    case 'RUST':
      throw new Error(
        `unsupported sonar scanner of language:{${language}},project:${param.gitOwner}/${param.repoName} `,
      );
    default:
      return new OthersLanguageService(param);
  }
}
