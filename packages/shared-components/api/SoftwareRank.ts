import HttpRequest from './HttpRequest';

export type rankInfo = {
  name: string;
  logo: string;
  htmlUrl: string;
  starCount: string;
  forkCount: string;
  contributorCount: string;
  trend: {
    xAxis: [];
    yAxis: [];
  };
};
export type rankPage = {
  pageNo: number;
  pageSize: number;
  data: Array<rankInfo>;
};

export function getStarsTopApi(params: { pageNo: number; pageSize?: number }, type: string) {
  return HttpRequest.get<rankPage>(`/trend/${type}`, {
    params,
  });
}
