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


def _generate_pipeline_url(failure_type: str) -> str:
    """
    Generate a plausible pipeline URL for the given failure type.

    Arg(s):
        failure_type (str): One of the FAILURE_TYPES values.
    Return Value(s):
        str: A mock Jenkins pipeline URL.
    """
    if failure_type == 'rebase-failure':
        return f'{JENKINS_BASE}/job/build%252Frebase/lastBuild/'
    return f'{JENKINS_BASE}/job/build%252Focp4/lastBuild/'


def generate_mock_failures() -> list[dict]:
    """
    Generate a list of mock failure records.

    Return Value(s):
        list[dict]: List of failure records with keys:
            name, group, failure_type, failure_count, pipeline_url
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

            failures.append({
                'name': component,
                'group': group,
                'failure_type': failure_type,
                'failure_count': failure_count,
                'pipeline_url': _generate_pipeline_url(failure_type),
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
