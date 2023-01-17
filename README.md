# ART Self Service

## Development Guild
### Setup Development Environment
- Install NodeJS:
  ```sh
  dnf install nodejs
  ```
- (Optional) Install [PNPm](https://pnpm.io/) package manager:
  ```sh
  corepack enable
  corepack prepare pnpm@latest --activate
  ```
### Build
- Install build dependencies:
  ```sh
  pnpm install
  ```

- Edit `next.config.js` if you need to deploy to a subpath on the web server. e.g.
  ```js
  basePath: '/pub/beta/self-service',
  ```
- Run
    ```sh
    pnpm build
    # or with npm
    npm run build
    # or
    yarn build
    ```
- Generated files can be found in `./out/`.
### Run Development Server

- First, run the development server:

    ```bash
    pnpm dev
    # or
    npm run dev
    # or
    yarn dev
    ```

- Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

This project uses [Next.js](https://nextjs.org/) framework bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). Web pages are rendered with [React](https://reactjs.org/). UI is constructed with [Material UI](https://mui.com/material-ui/getting-started/overview/).

### Directory Structure
```
├── components          React components. Step-specific portions of the self-service wizard can be found in this directory.
├── next.config.js      Next.js config
├── package.json        npm package metadata
├── pages               Web pages
├── pnpm-lock.yaml      pnpm's lockfile
├── public              Public and static artifacts
├── styles              Stylesheets (CSS, etc)
├── tsconfig.json       TypeScript config
└── utility             Utilities
```
