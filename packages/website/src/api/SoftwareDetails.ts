import HttpRequest from '@api/HttpRequest'

type Performance = {
  size: number
  gzipSize: number
  benchmarkScore: number
}

export function getPerformance(repoName: string) {
  return HttpRequest.get<Performance>(`/api/softwareDetail/performance/${repoName}`)
}
