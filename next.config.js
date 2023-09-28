const { gaVersion } = require('./components/api_calls/release_calls');
module.exports = {
    async redirects() {
        const gaResponse = await gaVersion();
        const currentGaVersion = gaResponse.payload;

        // Set redirect automatically to GA release version page
        return [
            {
                source: '/dashboard',
                destination: `/dashboard/release/openshift-${currentGaVersion}`,
                permanent: true,
            },
        ];
    }
};