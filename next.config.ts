import { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverExternalPackages: ["@supabase/supabase-js"],
  },
};

export default nextConfig;
