/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages 需要 basePath 匹配仓库名
  // 如果部署到 https://username.github.io/repo-name/，取消下面注释
  // basePath: '/personal-knowledge-system',
  // assetPrefix: '/personal-knowledge-system',
};

module.exports = nextConfig;
