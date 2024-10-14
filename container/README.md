# Development

Clone the repo and run `next dev`. The website will be hosted on `localhost:3000` by default. <br>
Run `next dev -p <port number>` if you want to host the website on a particular port, but make sure that [art-dashboard-backend](https://github.com/openshift-eng/art-dashboard-server)
is already up and running. Or the dashboard page will not load.

To get local working version using the production backend:

* `git clone https://github.com/openshift-eng/art-dashboard-ui.git; cd art-dashboard-ui`
* Modify [api_calls.js](components/api_calls/api_calls.js) and change `server_endpoint = "http://localhost:8080"` to `server_endpoint = "https://art-dash-server-art-dashboard-server.apps.artc2023.pc3z.p1.openshiftapps.com"`
* `npm install`
* `npx next build`
* `npx next dev -p 3009`
* Log onto the Redhat VPN
* Browse to http://127.0.0.1:3009

See Notes if you encounter errors while running the commands above

# Production

Refer the [Dockerfile](Dockerfile). `next build` will create an optimized build for production and we can start it 
with `next start`. Create PRs against the `dev` branch first. Once the PR is reviewed and merged, start a build in 
`art-build-dev` namespace (sometimes it won't start due to memory limitations, in that case pause some deployments and try again).
The website will pick the server running in the same namespace. Make sure that its deployed and the pod is running.

Once its confirmed that there's no obvious issues and all the new features are tested, create a PR against the master while documenting
all the new features and merge after approval from the team. Start the build in the `aos-art-web` namespace. 

_(Adding webhooks to automatically start the builds are in the works. Update this doc if it's already there)_

# Notes

- If, upon running `next dev` or `next build`, you encounter errors such as `Cannot read properties of null (reading 'useContext')` or `Invalid hook call`, try instead `npx next dev` or `npx next build` (these use locally installed NextJS from `node_modules`)
- `next dev` will load variables from `.env.development` and then values from `.env`. If same values exist in both, the value
defined in the former will take priority over the latter. In production, when `next build && next start` is run
values from `.env.production` will take priority over `.env`.
- If you want to test with some env variables in your local development environment. Create a file `.env.local`. Variables
defined in that file will take precedence over all other env files. But make sure to not check it into git by accident.
