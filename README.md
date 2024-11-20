# ART build history
Search for build records in BigQuery, and display the results in a table view.

- set the search filters as needed
- click "Search" to look up build records in BigQuery; results are cached client-side
- tune the filters to limit the displayed results; click "Filter" to affect the rendered HTML; cached results are not cleared
- you can share a search by copying the full URL containing the query string

# Deployment

The application depends on GCP credentials to access BigQuery API. You should have a .json file with the appplication
credentials. Create a secret with the contenst of this file:
```bash
oc -n <your-project> create secret generic gcp-credentials --from-file=gcp-credentials.json=/path/to/creds.json
```

Then, simply create all needed resources using the `resources` folder contents:
```bash
oc -n <your-project> create -f resources/is.yaml
oc -n <your-project> create -f resources/buildconfig.yaml
oc -n <your-project> create -f resources/deploymentconfig.yaml
oc -n <your-project> create -f resources/service.yaml
oc -n <your-project> create -f resources/route.yaml
```

You can also expose the service using oc rather than creating the route from the yaml definition, but in this case
you'll need to patch its definition to terminate SSL/TLS encryption at the OpenShift router:
```bash
oc expose svc/art-build-history --name=art-build-history --port=8000
oc patch route/art-build-history -p '{"spec":{"tls":{"termination":"edge"}}}'
```
