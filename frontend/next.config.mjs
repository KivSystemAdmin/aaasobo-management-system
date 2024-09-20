/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://aaasobo-managament-system-frontend.vercel.app",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,POST",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
