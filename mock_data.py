#!/usr/bin/env python3

"""
Generates realistic mock failure data for local development without Redis.
Used when REDIS_SERVER_PASSWORD is not set.
"""

import random

GROUPS = [
    'openshift-4.19',
    'openshift-4.18',
    'openshift-4.17',
    'openshift-4.16',
    'okd-4.21',
]

COMPONENTS = [
    'ironic', 'cluster-etcd-operator', 'machine-config-operator',
    'console', 'oauth-server', 'cluster-authentication-operator',
    'cluster-monitoring-operator', 'cluster-ingress-operator',
    'multus-cni', 'sriov-network-operator', 'kuryr-cni',
    'ovn-kubernetes', 'cloud-credential-operator', 'aws-ebs-csi-driver',
    'gcp-pd-csi-driver', 'azure-disk-csi-driver', 'vsphere-csi-driver',
    'oc-mirror', 'installer', 'hyperkube', 'cli',
    'cluster-node-tuning-operator', 'driver-toolkit',
    'cluster-storage-operator', 'openstack-cinder-csi-driver',
    'baremetal-operator', 'cluster-baremetal-operator',
    'metallb', 'must-gather', 'tests', 'tools',
]

FAILURE_TYPES = [
    'build-failure',
    'ec-failure',
    'release-failure',
    'rebase-failure',
]

JENKINS_BASE = 'https://art-jenkins.apps.prod-stable-spoke1-dc-iad2.itup.redhat.com/job/aos-cd-builds'
KONFLUX_BASE = 'https://console.redhat.com/preview/application-pipeline/workspaces/ocp/applications'


def _generate_pipeline_urls(failure_type: str, component: str) -> tuple[str, str]:
    """
    Generate plausible pipeline URLs for the given failure type.

    Arg(s):
        failure_type (str): One of the FAILURE_TYPES values.
        component (str): Component name for generating Konflux URL.
    Return Value(s):
        tuple[str, str]: (jenkins_url, pipeline_url) where one may be empty.
    """
    # 70% chance of having a jenkins URL for non-rebase failures
    # 30% chance of having a konflux pipeline URL instead
    rand_val = random.random()

    if failure_type == 'rebase-failure':
        # Rebase failures only have jenkins URLs
        return (f'{JENKINS_BASE}/job/build%252Frebase/lastBuild/', '')
    elif rand_val < 0.7:
        # Jenkins build
        return (f'{JENKINS_BASE}/job/build%252Focp4/lastBuild/', '')
    else:
        # Konflux pipeline run
        pipeline_run_id = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=8))
        return ('', f'{KONFLUX_BASE}/{component}/pipelineruns/{component}-build-{pipeline_run_id}')


def generate_mock_failures() -> list[dict]:
    """
    Generate a list of mock failure records.

    Return Value(s):
        list[dict]: List of failure records with keys:
            name, group, failure_type, failure_count, jenkins_url, pipeline_url
    """
    random.seed(42)
    failures = []

    for group in GROUPS:
        num_failures = random.randint(5, 15)
        selected_components = random.sample(COMPONENTS, min(num_failures, len(COMPONENTS)))

        for component in selected_components:
            failure_type = random.choice(FAILURE_TYPES)
            failure_count = random.choices(
                range(1, 30),
                weights=[30 - i for i in range(29)],
                k=1,
            )[0]

            jenkins_url, pipeline_url = _generate_pipeline_urls(failure_type, component)

            failures.append({
                'name': component,
                'group': group,
                'failure_type': failure_type,
                'failure_count': failure_count,
                'jenkins_url': jenkins_url,
                'pipeline_url': pipeline_url,
            })

    return failures


def get_mock_groups() -> list[str]:
    """
    Return Value(s):
        list[str]: Sorted list of mock group names (newest first).
    """
    return sorted(GROUPS, reverse=True)


def get_mock_failure_types() -> list[str]:
    """
    Return Value(s):
        list[str]: List of failure type identifiers.
    """
    return list(FAILURE_TYPES)
