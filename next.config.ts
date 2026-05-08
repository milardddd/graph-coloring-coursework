import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'export',
    basePath: '/graph-coloring-coursework',
    images: {
        unoptimized: true,
    },
};

export default nextConfig;