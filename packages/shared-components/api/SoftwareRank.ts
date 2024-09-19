import type { Page, PageParam } from './HttpRequest';
import HttpRequest from './HttpRequest';

export type RankInfo = {
  currentRank: number;
  previousRank?: number;
  increasedValue: number;
  totalValue: number;
  name: string;
  logo: string;
  htmlUrl: string;
  description: string;
  createdAt: string;
};

export type TableHeaders = {
  [k in keyof RankInfo]?: string;
};

export type SoftwareRank = {
  data: RankInfo[];
  headers: TableHeaders;
};

export type SelectOptions = {
  label: string;
  value: string;
};
export enum DataType {
  star = '1',
  contributor = '2',
  ecoScore = '3',
  qualityScore = '4',
  downloadCount = '5',
}
export enum DateType {
  year = '1',
  month = '2',
  week = '3',
}
export enum RankType {
  increase = '1',
  total = '2',
}
export function getSoftwareRankApi(
  params: PageParam & { dateType: DateType; rankType: RankType; language?: string },
  type: DataType,
) {
  return HttpRequest.get<Page<SoftwareRank>>(`/trend/rank/${type}`, {
    params,
  });
}

export const getLanguageOptionsApi = () =>
  HttpRequest.get<SelectOptions[]>('/trend/languageFilter');
