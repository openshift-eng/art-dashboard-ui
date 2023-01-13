module.exports = {
    async redirects() {
        // Set redirect automatically to GA release version page
        return [
            {
                source: '/dashboard',
                destination: '/dashboard/release/openshift-' + process.env.NEXT_PUBLIC_GA_VERSION,
                permanent: true,
            },
        ]
    },
}