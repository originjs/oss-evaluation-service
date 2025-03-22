import HttpRequest from './HttpRequest';
import type { BenchmarkTechStack } from '@orginjs/oss-evaluation-api-server';
import type {
  BenchmarkIndex,
  SoftwareBaseInfo,
  BenchmarkResult,
} from '@orginjs/oss-evaluation-api-server';

export type { BenchmarkIndex, SoftwareBaseInfo, BenchmarkResult };

export function getTechStacks() {
  return HttpRequest.get<BenchmarkTechStack[]>(`/benchmark/techStacks`);
}

export function getProjectsByTechStack(category: string, techStack: string) {
  return HttpRequest.get<Array<SoftwareBaseInfo>>(`/benchmark/techstack/${category}/${techStack}`);
}

export function getIndexByTechStack(techStack: string) {
  return HttpRequest.get<Array<BenchmarkIndex>>(`/benchmark/indexs/${techStack}`);
}

export function getBenchmarkResultByTechStack(techStack: string) {
  return HttpRequest.get<Array<BenchmarkResult>>(`/benchmark/result/${techStack}`);
}
