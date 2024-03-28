import HttpRequest from './HttpRequest';

export type SoftwareInfo = {
  name: string;
  url: string;
  description: string;
  star: number;
};

export function getSoftwareNamesApi(params: { keyword: string; techStack?: string }) {
  return HttpRequest.get<SoftwareInfo[]>(`/home/search`, {
    params,
  });
}
