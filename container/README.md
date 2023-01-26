# Development

Clone the repo and run `next dev`. The website will be hosted on `localhost:3000` by default. <br>
Run `next dev -p <port number>` if you want to host the website on a particular port, but make sure that [art-dashboard-backend](https://github.com/openshift-eng/art-dashboard-server)
is already up and running. Or the dashboard page will not load.


# Production

Refer the [Dockerfile](Dockerfile). `next build` will create an optimized build for production and we can start it 
with `next start`. Create PRs against the `dev` branch first. Once the PR is reviewed and merged, start a build in 
`art-build-dev` namespace (sometimes it won't start due to memory limitations, in that case pause some deployments and try again).
The website will pick the server running in the same namespace. Make sure that its deployed and the pod is running.

Once its confirmed that there's no obvious issues and all the new features are tested, create a PR against the master while documenting
all the new features and merge after approval from the team. Start the build in the `aos-art-web` namespace. 

_(Adding webhooks to automatically start the builds are in the works. Update this doc if it's already there)_

# Notes

- `next dev` will load variables from `.env.development` and then values from `.env`. If same values exist in both, the value
defined in the former will take priority over the latter. In production, when `next build && next start` is run
values from `.env.production` will take priority over `.env`.
- If you want to test with some env variables in your local development environment. Create a file `.env.local`. Variables
defined in that file will take precedence over all other env files. But make sure to not check it into git by accident.