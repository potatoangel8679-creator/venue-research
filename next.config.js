/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Google Places 사진, Supabase Storage 사진을 위한 도메인 허용
    remotePatterns: [
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }
    ]
  }
};

module.exports = nextConfig;
