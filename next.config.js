module.exports = {
    transpilePackages: ["antd", "@ant-design", "rc-util", "rc-pagination", "rc-picker", "rc-notification", "rc-tooltip", "rc-tree", "rc-table"],
    webpack: (config, { isServer }) => {
        config.watchOptions = {
            ...config.watchOptions,
            ignored: ['**/.superpowers/**', '**/node_modules/**'],
        };
        return config;
    },
    async redirects() {
        return [
            {
                source: '/dashboard',
                destination: '/dashboard/products/openshift',
                permanent: false,
            },
        ];
    }
};
