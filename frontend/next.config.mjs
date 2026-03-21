const nextConfig = {
  turbopack: {
    resolveAlias: {
      "@": "./src",
    },
  },
  images: {
    localPatterns: [
      {
        pathname: "/instructors/**",
      },
    ],
  },
};

export default nextConfig;
