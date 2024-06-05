import HttpRequest from './HttpRequest';
import type {
  BenchmarkIndex,
  SoftwareBaseInfo,
  BenchmarkResult,
} from '@orginjs/oss-evaluation-api-server';

export { BenchmarkIndex, SoftwareBaseInfo, BenchmarkResult };

export function getProjectsByTechStack(category: string, techStack: string) {
  return HttpRequest.get<Array<SoftwareBaseInfo>>(`/benchmark/techstack/${category}/${techStack}`);
}

export function getIndexByTechStack(techStack: string) {
  return HttpRequest.get<Array<BenchmarkIndex>>(`/benchmark/indexs/${techStack}`);
}

export function getBenchmarkResultByTechStack(techStack: string) {
  return HttpRequest.get<Array<BenchmarkResult>>(`/benchmark/result/${techStack}`);
}
