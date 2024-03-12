import HttpRequest from './HttpRequest';

export type SoftwareInfo = {
  fullName: string;
  htmlUrl: string;
  description: string;
  stargazersCount: number;
};

export function getSoftwareNamesApi(keyword: string) {
  return HttpRequest.get<SoftwareInfo[]>(`/api/home/search/${keyword}`);
}
