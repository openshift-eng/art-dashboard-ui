# ART Dashboard UI

Built using `React` and `NextJS` and deployed at http://art-dash.engineering.redhat.com/ (internal)

Uses [art-dashboard-server](https://github.com/openshift-eng/art-dashboard-server) as backend.

The release workspace supports OpenShift, ACM, and MCE at `/dashboard/products`.
Select a product and group, then a release. Release links include the assembly
name, for example `/dashboard/products/acm/acm-2.17/2.17.4`. Existing
`/dashboard/release/openshift-4.21?page=2` links remain supported.

Opening a product selects its latest GA group, and the sidebar's Latest GA Version
links back to that group. Explicit group and release links retain their selection.
`/dashboard` opens OpenShift and resolves GA at runtime through
`products/openshift/ga/`, rather than fixing a version during the UI build.
OpenShift GA comes from Cincinnati fast channel filenames; ACM and MCE use the
highest numeric build-data group with a non-empty `releases.yml` release mapping.
When GA cannot be determined, users can still select a group manually.

The server's product API must be deployed before this UI. Product identities and
group discovery are configured by the server; the UI does not maintain a second
product registry. Shipment and approval views preserve separate FBC targets and
per-shipment stage/production results. The theme toggle retains the user's saved
light/dark preference.

Run the dashboard regression tests with `npm test -- --runInBand` and the
production build with `npm run build`.

For directions on building and setting up a development environment, visit the container [README](/container/README.md).
