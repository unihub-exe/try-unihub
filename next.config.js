/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ["try-unihub.onrender.com", "localhost"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
            {
                protocol: "http",
                hostname: "**",
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: "/backend/:path*",
                destination: "https://try-unihub.onrender.com/:path*",
            },
        ];
    },
};

module.exports = nextConfig;
