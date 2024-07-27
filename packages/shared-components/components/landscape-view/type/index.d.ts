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
  bigProject: string;
  labels: string[];
  language: string;
}

export interface Subcategory {
  subTechStackName: string;
  projects: Project[];
  width?: number;
  hasBigProject?: boolean;
  count: number; // 所有项目数量
  displayCount: number; // 展示项目数量
}

export type Category = Record<string, Record<string, Subcategory>>;
