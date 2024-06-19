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
  normalizedProjectsCount?: number;
  hasBigProject?: boolean;
}

export interface Category {
  category: string;
  subcategory: Subcategory[];
}
