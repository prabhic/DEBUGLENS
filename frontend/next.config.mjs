/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  webpack: (config, { isServer, dev }) => {
    console.log("=== Configuring Webpack Watch ===");

    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: ["**/node_modules", "**/.git", "**/.next"],
    };

    // Use a different source map strategy in development
    if (dev) {
      config.devtool = "cheap-module-source-map";
    }

    return config;
  },
  // Update rewrites for production
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/:path*",
            destination: "http://localhost:5000/api/:path*",
          },
        ]
      : [];
  },
};

export default nextConfig;
