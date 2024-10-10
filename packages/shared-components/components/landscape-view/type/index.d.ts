export enum RadarRing {
  Adopt = 0,
  Trial = 1,
  Assess = 2,
  Hold = 3,
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
