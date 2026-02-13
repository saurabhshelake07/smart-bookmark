import { NextConfig } from "next";
import { supabase } from "@/lib/supabase";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverExternalPackages: ["@supabase/supabase-js"], // use this instead
  },
};

export default nextConfig;
