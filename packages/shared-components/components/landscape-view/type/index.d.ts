export enum RadarRing {
  Adopt = 0,
  Trial = 1,
  Assess = 2,
  Hold = 3,
}

// 衰退期告警级别
enum RecessionRiskLevel {
  PENDING = 'PENDING',
  HIGH = '高',
  MID = '中',
  LOW = '低',
}

// 供应风险等级
enum SupplyRiskLevel {
  UNKNOWN = '未知',
  HIGH = '高',
  MID = '中',
  LOW = '低',
}

export interface Project {
  category: string;
  subcategory: string;
  name: string;
  description: string;
  htmlUrl: string;
  logo: string;
  starCount: number;
  forksCount: number;
  hasBenchmark: string;
  labels: string[];
  language: string;
  radarRing?: RadarRing;
  recessionRiskLevel?: RecessionRiskLevel;
  supplyRiskLevel?: SupplyRiskLevel;
}

export interface Subcategory {
  subTechStackName: string;
  projects: Project[];
  width?: number;
  isRadarRingAdopt?: boolean;
  count: number; // 所有项目数量
  displayCount: number; // 展示项目数量
}

export type Category = Record<string, Record<string, Subcategory>>;
