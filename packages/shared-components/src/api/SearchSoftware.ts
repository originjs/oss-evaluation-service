import HttpRequest from './HttpRequest';

export type SoftwareInfo = {
  fullName: string;
  htmlUrl: string;
  description: string;
  stargazersCount: number;
};

export function getSoftwareInfoListApi(params: { keyword: string; techStack?: string }) {
  return HttpRequest.get<SoftwareInfo[]>(`/home/search`, {
    params,
  });
}
