/**
 * 从给定的URL中提取仓库名称，如果URL以'.git'结尾，则自动去除该后缀。
 *
 * @param {string} url - 需要处理的URL字符串。
 * @returns {string | null} - 提取的仓库名称，如果没有匹配到正确的模式则返回null。
 */
export const extractRepositoryName = (url: string): string | null => {
  const pattern = /^https:\/\/(github|gitee|gitcode)\.com\/([^/]+\/[^/]+?)(\.git)?$/;
  const match = url.match(pattern);
  if (match) {
    return match[2];
  }
  return null;
};
