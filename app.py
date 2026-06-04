#!/usr/bin/env python3

"""
ART Build Failures Dashboard.

A Flask web application that displays Konflux build failure data from Redis.
Supports filtering by group, failure type, and component name, with both
tabular and bubble chart visualizations.

Run in dev mode (mock data, no Redis required):
    ART_DASH_DEV=1 python app.py

Run with production Redis (requires VPN and REDIS_SERVER_PASSWORD):
    REDIS_SERVER_PASSWORD=xxx python app.py
"""

import asyncio
import logging
import os
import re
from typing import Optional

from artcommonlib import redis
from flask import Flask, jsonify, render_template, request
from jira import JIRA
from mock_data import generate_mock_failures, get_mock_failure_types, get_mock_groups
from pyartcd.jira_client import JIRAClient

DEV_MODE = os.environ.get('ART_DASH_DEV', '').lower() in ('1', 'true', 'yes')
REDIS_AVAILABLE = bool(os.environ.get('REDIS_SERVER_PASSWORD'))
JIRA_AVAILABLE = bool(os.environ.get('JIRA_TOKEN'))

FAILURE_TYPES = ['build-failure', 'ec-failure', 'release-failure', 'rebase-failure']

logger = logging.getLogger(__name__)

# Global Jira client (initialized lazily)
_jira_client: Optional[JIRAClient] = None


def _create_app() -> Flask:
    """
    Create and configure the Flask application with all routes.

    Return Value(s):
        Flask: Configured Flask application instance.
    """
    app = Flask(__name__)
    _init_logger()
    _add_routes(app)
    return app


def _init_logger():
    """
    Configure the module logger with a timestamped formatter.
    """
    formatter = logging.Formatter('%(asctime)s %(name)s:%(levelname)s %(message)s')
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False
    logger.level = logging.INFO

    if DEV_MODE:
        logger.warning('Dev mode enabled (ART_DASH_DEV=1)')
    if not REDIS_AVAILABLE:
        logger.warning('REDIS_SERVER_PASSWORD not set — using mock data')
    if not JIRA_AVAILABLE:
        logger.warning('JIRA_TOKEN not set — Jira links will not be available')


def _get_jira_client() -> Optional[JIRAClient]:
    """
    Get or create the global Jira client instance.

    Return Value(s):
        Optional[JIRAClient]: Jira client if credentials are available, None otherwise.
    """
    global _jira_client
    if not JIRA_AVAILABLE:
        return None
    if _jira_client is None:
        jira_url = os.environ.get('JIRA_URL', 'https://redhat.atlassian.net')
        jira_email = os.environ.get('JIRA_EMAIL', 'aos-art-automation@redhat.com')
        jira_token = os.environ['JIRA_TOKEN']
        try:
            _jira_client = JIRAClient.from_url(jira_url, basic_auth=(jira_email, jira_token))
            logger.info('Jira client initialized successfully')
        except Exception as e:
            logger.warning('Failed to initialize Jira client: %s', e)
            return None
    return _jira_client


async def _fetch_jira_tickets_for_failures(failures: list[dict]) -> dict[tuple[str, str], str]:
    """
    Fetch Jira tickets for build failures from Jira API.
    Queries for open tickets with labels art:image-build-failure, art:image-ec-failure,
    art:image-release-failure to match them with failures.

    Arg(s):
        failures (list[dict]): List of failure records from Redis.
    Return Value(s):
        dict: {(image_name, group): jira_ticket_key}
    """
    jira_client = _get_jira_client()
    if not jira_client:
        return {}

    # Map failure types to Jira labels
    label_map = {
        'build-failure': 'art:image-build-failure',
        'ec-failure': 'art:image-ec-failure',
        'release-failure': 'art:image-release-failure',
        'rebase-failure': 'art:image-rebase-failure',
    }

    jira_tickets = {}

    try:
        # Query all open tickets for all failure types in parallel
        labels = list(label_map.values())
        labels_str = ','.join([f'"{label}"' for label in labels])
        jql = f'project = ART AND labels in ({labels_str}) AND statusCategory != Done'
        logger.info('Querying Jira with JQL: %s', jql)

        open_tickets = jira_client.search_issues(jql, maxResults=False)
        logger.info('Found %d open Jira tickets', len(open_tickets))

        # Index tickets by (image_name, group)
        for ticket in open_tickets:
            image_name = None
            group = None
            for label in ticket.fields.labels:
                if label.startswith('art:package:'):
                    image_name = label[len('art:package:') :]
                elif label.startswith('art:group:'):
                    group = label[len('art:group:') :]
            if image_name and group:
                jira_tickets[(image_name, group)] = ticket.key

        logger.info('Indexed %d Jira tickets by (image_name, group)', len(jira_tickets))

    except Exception as e:
        logger.warning('Failed to fetch Jira tickets: %s', e)

    return jira_tickets


def _add_routes(app: Flask):
    """
    Register all route handlers on the Flask app.

    Arg(s):
        app (Flask): The Flask application instance.
    """

    @app.route('/')
    def index():
        return render_template('failures.html')

    @app.route('/api/failures', methods=['GET'])
    async def api_failures():
        if not REDIS_AVAILABLE:
            failures = generate_mock_failures()
        else:
            # Fetch failures and Jira tickets in parallel
            failures, jira_tickets = await asyncio.gather(
                _fetch_all_failures(), _fetch_jira_tickets_for_failures([])
            )

            # Add jira_ticket field to each failure
            for failure in failures:
                key = (failure['name'], failure['group'])
                failure['jira_ticket'] = jira_tickets.get(key, '')

        failures.sort(key=lambda f: f['failure_count'], reverse=True)
        return jsonify(failures)

    @app.route('/api/groups', methods=['GET'])
    async def api_groups():
        if not REDIS_AVAILABLE:
            return jsonify(get_mock_groups())

        groups = await _discover_failure_groups()
        return jsonify(groups)

    @app.route('/api/failure-types', methods=['GET'])
    async def api_failure_types():
        if not REDIS_AVAILABLE:
            return jsonify(get_mock_failure_types())
        return jsonify(FAILURE_TYPES)


async def _fetch_all_failures() -> list[dict]:
    """
    Fetch all failure data from Redis across all failure types.
    Scans all 4 failure types in parallel, uses batched MGET per type.

    Return Value(s):
        list[dict]: Flat list of failure records with keys:
            name, group, failure_type, failure_count, jenkins_url, pipeline_url
    """
    results = await asyncio.gather(*[_fetch_failures_for_type(ft) for ft in FAILURE_TYPES])
    all_failures = []
    for result in results:
        all_failures.extend(result)
    return all_failures


async def _fetch_failures_for_type(failure_type: str) -> list[dict]:
    """
    Fetch failure data from Redis for a single failure type.

    Arg(s):
        failure_type (str): e.g. 'build-failure', 'ec-failure'
    Return Value(s):
        list[dict]: Failure records for this type.
    """
    pattern = f'count:{failure_type}:*:*:*:failure'

    try:
        failure_keys = await redis.get_keys(pattern)
    except Exception as e:
        logger.warning('Failed to fetch keys for pattern %s: %s', pattern, e)
        return []

    if not failure_keys:
        return []

    jenkins_url_keys = [k.rsplit(':', 1)[0] + ':jenkins_url' for k in failure_keys]
    pipeline_url_keys = [k.rsplit(':', 1)[0] + ':pipeline_url' for k in failure_keys]

    try:
        counts, jenkins_urls, pipeline_urls = await asyncio.gather(
            redis.get_multiple_values(failure_keys),
            redis.get_multiple_values(jenkins_url_keys),
            redis.get_multiple_values(pipeline_url_keys),
        )
    except Exception as e:
        logger.warning('Failed to batch fetch for %s: %s', failure_type, e)
        return []

    failures = []
    for i, failure_key in enumerate(failure_keys):
        parts = failure_key.split(':')
        if len(parts) < 3:
            continue

        entity_name = parts[-2]
        group = parts[-3]
        count_val = counts[i] if counts[i] else '0'

        failures.append({
            'name': entity_name,
            'group': group,
            'failure_type': failure_type,
            'failure_count': int(count_val),
            'jenkins_url': jenkins_urls[i] or '',
            'pipeline_url': pipeline_urls[i] or '',
        })

    return failures


async def _discover_failure_groups() -> list[str]:
    """
    Discover distinct groups by scanning Redis failure key patterns.

    Return Value(s):
        list[str]: Sorted list of group names (openshift versions descending, then alphabetical).
    """
    groups = set()
    pattern = 'count:*-failure:*:*:*:failure'

    try:
        keys = await redis.get_keys(pattern)
        for key in keys:
            parts = key.split(':')
            if len(parts) >= 5:
                groups.add(parts[-3])
    except Exception as e:
        logger.warning('Failed to discover failure groups: %s', e)

    def _sort_key(group: str):
        match = re.match(r'openshift-(\d+)\.(\d+)$', group)
        if match:
            major, minor = map(int, match.groups())
            return (0, -major, -minor)
        return (1, group.lower())

    return sorted(groups, key=_sort_key)


app = _create_app()


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
