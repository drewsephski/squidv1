import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const BUILD_OUTPUT = process.env.NEXT_STANDALONE_OUTPUT
  ? "standalone"
  : undefined;

export default () => {
  const nextConfig: NextConfig = {
    output: BUILD_OUTPUT,
    cleanDistDir: true,
    devIndicators: {
      position: "bottom-right",
    },
    env: {
      NO_HTTPS: process.env.NO_HTTPS,
      NEXT_PUBLIC_SQUID_PORT: process.env.NEXT_PUBLIC_SQUID_PORT,
    },
    experimental: {
      taint: true,
      authInterrupts: true,
    },
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.externals = {
          ...config.externals,
          "better-sqlite3": "commonjs better-sqlite3",
          electron: "commonjs electron",
        };
      }
      return config;
    },
    images: {
      remotePatterns: [
        {
          protocol: "http",
          hostname: "localhost",
          port: "3000",
          pathname: "/api/storage/**",
        },
      ],
    },
  };
  const withNextIntl = createNextIntlPlugin();
  return withNextIntl(nextConfig);
};
