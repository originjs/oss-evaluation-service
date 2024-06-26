/**
 * 从给定的URL中提取仓库名称，仅处理以'https://github.com/'开头的URL。
 * 如果URL以'.git'结尾，则自动去除该后缀。
 *
 * @param {string} url - 需要处理的URL字符串。
 * @returns {string | null} - 提取的仓库名称，如果没有匹配到正确的模式则返回null。
 */
export const extractRepositoryName = (url: string): string | null => {
  // 正则表达式匹配'https://github.com/'之后的内容，直到'/'
  const pattern = /^https:\/\/github.com\/([^/]+\/[^/]+?)(\.git)?$/;

  // 使用正则表达式进行匹配
  const match = url.match(pattern);

  // 如果匹配成功，则提取并返回仓库名称，如果以.git结尾则去掉该后缀
  if (match) {
    return match[1].replace(/\.git$/, '');
  }

  // 如果不是正确的格式，返回null
  return null;
};
