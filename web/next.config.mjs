const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

const nextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/:path*` }];
  },
};

export default nextConfig;
