/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ["unihub-test-server.onrender.com", "invite-server-cykk.onrender.com", "localhost"],
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
                destination: "https://invite-server-cykk.onrender.com/:path*",
            },
        ];
    },
};

module.exports = nextConfig;
