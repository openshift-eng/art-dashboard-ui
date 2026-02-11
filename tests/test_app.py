#!/usr/bin/env python3

"""
Unit tests for the ART Build History Flask application.
"""

import os
import sys
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest

# Add parent directory to path to import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


# Helper function to create async generator mocks
async def async_generator_empty():
    """
    Empty async generator for mocking database searches.
    """
    return
    yield  # Make this a generator


@pytest.fixture
def app():
    """
    Create a test Flask application instance.
    """
    with patch('artcommonlib.bigquery.BigQueryClient'):
        with patch('artcommonlib.redis.get_value', return_value=None):
            with patch('artcommonlib.redis.set_value'):
                from app import KonfluxBuildHistory

                test_app = KonfluxBuildHistory()
                test_app.config['TESTING'] = True
                yield test_app


@pytest.fixture
def client(app):
    """
    Create a test client for the Flask application.

    Arg(s):
        app: Flask application fixture
    Return Value(s):
        Flask test client
    """
    return app.test_client()


def test_index_route(client):
    """
    Test that the index route returns successfully.
    """
    response = client.get('/')
    assert response.status_code == 200
    assert b'Build History' in response.data or b'html' in response.data


@pytest.mark.parametrize(
    'route',
    [
        '/build',
        '/diff',
        '/logs',
    ],
)
def test_routes_exist(client, route):
    """
    Test that main routes are accessible.

    Arg(s):
        client: Flask test client
        route: Route path to test
    """
    response = client.get(route)
    # Should either return 200 or redirect, but not 404
    assert response.status_code != 404


def test_static_files(client):
    """
    Test that static files are served correctly.
    """
    response = client.get('/static/js/index.js')
    assert response.status_code == 200


# Search Logic Tests


def test_extract_nvr_start_time_valid():
    """
    Test extracting datetime from valid NVR format.
    """
    from app import KonfluxBuildHistory

    nvr = 'openshift-cli-4.15.0-202401151030.p0.g12a3b4c.assembly.stream.el9'
    result = KonfluxBuildHistory.extract_nvr_start_time(nvr)
    assert result == datetime(2024, 1, 15, 10, 30)


def test_extract_nvr_start_time_invalid():
    """
    Test extracting datetime from invalid NVR formats.
    """
    from app import KonfluxBuildHistory

    # NVR without datetime
    assert KonfluxBuildHistory.extract_nvr_start_time('simple-package-1.0-1.el9') is None

    # NVR with invalid datetime format
    assert KonfluxBuildHistory.extract_nvr_start_time('package-202413991030.el9') is None

    # Empty string
    assert KonfluxBuildHistory.extract_nvr_start_time('') is None

    # None
    assert KonfluxBuildHistory.extract_nvr_start_time(None) is None


@pytest.mark.asyncio
async def test_query_missing_date_range_and_nvr():
    """
    Test that query returns error when no date range or NVR datetime is provided.
    """
    from app import KonfluxBuildHistory

    with patch('artcommonlib.bigquery.BigQueryClient'):
        with patch('artcommonlib.redis.get_value', return_value=None):
            with patch('artcommonlib.redis.set_value'):
                app_instance = KonfluxBuildHistory()

                # Empty params should return error
                result = await app_instance.query({})
                assert 'error' in result
                assert 'date range' in result['error'].lower()
                assert result['builds'] == []


@pytest.mark.asyncio
async def test_query_container_suffix_removal():
    """
    Test that -container suffix is removed from name and warning is generated.
    """
    from app import KonfluxBuildHistory

    with patch('artcommonlib.bigquery.BigQueryClient'):
        with patch('artcommonlib.redis.get_value', return_value=None):
            with patch('artcommonlib.redis.set_value'):
                app_instance = KonfluxBuildHistory()

                # Mock the search_builds_by_fields to avoid actual DB calls
                with patch('app.KonfluxDb') as mock_db:
                    mock_instance = MagicMock()
                    mock_instance.bind = MagicMock()
                    mock_instance.search_builds_by_fields = MagicMock(return_value=async_generator_empty())
                    mock_db.return_value = mock_instance

                    params = {
                        'name': 'openshift-cli-container',
                        'dateRange': '2024-01-15',
                    }
                    result = await app_instance.query(params)

                    # Should have warning about container suffix removal
                    assert 'warnings' in result
                    assert any('-container' in w and 'removed' in w.lower() for w in result['warnings'])


@pytest.mark.asyncio
async def test_query_commitish_prefix_pattern():
    """
    Test that commitish uses starts-with pattern logic.
    """
    from app import KonfluxBuildHistory

    with patch('artcommonlib.bigquery.BigQueryClient'):
        with patch('artcommonlib.redis.get_value', return_value=None):
            with patch('artcommonlib.redis.set_value'):
                app_instance = KonfluxBuildHistory()

                captured_patterns = {}

                async def capture_patterns(**kwargs):
                    captured_patterns.update(kwargs.get('extra_patterns', {}))
                    return
                    yield  # Make this a generator

                with patch('app.KonfluxDb') as mock_db:
                    mock_instance = MagicMock()
                    mock_instance.bind = MagicMock()
                    mock_instance.search_builds_by_fields = MagicMock(side_effect=capture_patterns)
                    mock_db.return_value = mock_instance

                    params = {
                        'commitish': 'abc123',
                        'dateRange': '2024-01-15',
                    }
                    await app_instance.query(params)

                    # Commitish should have ^ prefix for starts-with matching
                    assert 'commitish' in captured_patterns
                    assert captured_patterns['commitish'] == '^abc123'


@pytest.mark.asyncio
async def test_query_date_range_single_date():
    """
    Test that single date is converted to one-day range.
    """
    from app import KonfluxBuildHistory

    with patch('artcommonlib.bigquery.BigQueryClient'):
        with patch('artcommonlib.redis.get_value', return_value=None):
            with patch('artcommonlib.redis.set_value'):
                app_instance = KonfluxBuildHistory()

                captured_dates = {}

                async def capture_dates(**kwargs):
                    captured_dates['start'] = kwargs.get('start_search')
                    captured_dates['end'] = kwargs.get('end_search')
                    return
                    yield  # Make this a generator

                with patch('app.KonfluxDb') as mock_db:
                    mock_instance = MagicMock()
                    mock_instance.bind = MagicMock()
                    mock_instance.search_builds_by_fields = MagicMock(side_effect=capture_dates)
                    mock_db.return_value = mock_instance

                    params = {'dateRange': '2024-01-15'}
                    await app_instance.query(params)

                    # Should set start to beginning of day and end to end of day
                    assert captured_dates['start'] == datetime(2024, 1, 15, 0, 0, 0, tzinfo=timezone.utc)
                    assert captured_dates['end'] == datetime(2024, 1, 15, 23, 59, 59, tzinfo=timezone.utc)


@pytest.mark.asyncio
async def test_query_date_range_full_range():
    """
    Test that date range with start and end is parsed correctly.
    """
    from app import KonfluxBuildHistory

    with patch('artcommonlib.bigquery.BigQueryClient'):
        with patch('artcommonlib.redis.get_value', return_value=None):
            with patch('artcommonlib.redis.set_value'):
                app_instance = KonfluxBuildHistory()

                captured_dates = {}

                async def capture_dates(**kwargs):
                    captured_dates['start'] = kwargs.get('start_search')
                    captured_dates['end'] = kwargs.get('end_search')
                    return
                    yield  # Make this a generator

                with patch('app.KonfluxDb') as mock_db:
                    mock_instance = MagicMock()
                    mock_instance.bind = MagicMock()
                    mock_instance.search_builds_by_fields = MagicMock(side_effect=capture_dates)
                    mock_db.return_value = mock_instance

                    params = {'dateRange': '2024-01-10 to 2024-01-20'}
                    await app_instance.query(params)

                    # Should set proper range
                    assert captured_dates['start'] == datetime(2024, 1, 10, 0, 0, 0, tzinfo=timezone.utc)
                    assert captured_dates['end'] == datetime(2024, 1, 20, 23, 59, 59, tzinfo=timezone.utc)


@pytest.mark.asyncio
async def test_query_nvr_datetime_extraction():
    """
    Test that NVR with embedded datetime sets automatic date range.
    """
    from app import KonfluxBuildHistory

    with patch('artcommonlib.bigquery.BigQueryClient'):
        with patch('artcommonlib.redis.get_value', return_value=None):
            with patch('artcommonlib.redis.set_value'):
                app_instance = KonfluxBuildHistory()

                captured_dates = {}

                async def capture_dates(**kwargs):
                    captured_dates['start'] = kwargs.get('start_search')
                    captured_dates['end'] = kwargs.get('end_search')
                    return
                    yield  # Make this a generator

                with patch('app.KonfluxDb') as mock_db:
                    mock_instance = MagicMock()
                    mock_instance.bind = MagicMock()
                    mock_instance.search_builds_by_fields = MagicMock(side_effect=capture_dates)
                    mock_db.return_value = mock_instance

                    params = {'nvr': 'openshift-cli-4.15.0-202401151030.p0.g12a3b4c.assembly.stream.el9'}
                    await app_instance.query(params)

                    # Should set +/- 2 days from NVR datetime
                    datetime(2024, 1, 15, 10, 30, tzinfo=timezone.utc)
                    assert captured_dates['start'] == datetime(2024, 1, 13, 10, 30, tzinfo=timezone.utc)
                    assert captured_dates['end'] == datetime(2024, 1, 17, 10, 30, tzinfo=timezone.utc)


@pytest.mark.asyncio
async def test_query_nvr_datetime_conflict_warning():
    """
    Test that conflicting NVR datetime and date range generates warning.
    """
    from app import KonfluxBuildHistory

    with patch('artcommonlib.bigquery.BigQueryClient'):
        with patch('artcommonlib.redis.get_value', return_value=None):
            with patch('artcommonlib.redis.set_value'):
                app_instance = KonfluxBuildHistory()

                with patch('app.KonfluxDb') as mock_db:
                    mock_instance = MagicMock()
                    mock_instance.bind = MagicMock()
                    mock_instance.search_builds_by_fields = MagicMock(return_value=async_generator_empty())
                    mock_db.return_value = mock_instance

                    # NVR has datetime from Jan 15, but date range is in Feb
                    params = {
                        'nvr': 'openshift-cli-4.15.0-202401151030.p0.g12a3b4c.assembly.stream.el9',
                        'dateRange': '2024-02-01 to 2024-02-28',
                    }
                    result = await app_instance.query(params)

                    # Should have warning about datetime mismatch
                    assert 'warnings' in result
                    assert any('outside' in w.lower() and 'date range' in w.lower() for w in result['warnings'])


@pytest.mark.asyncio
async def test_query_where_clauses():
    """
    Test that query parameters are properly converted to where clauses.
    """
    from app import KonfluxBuildHistory

    with patch('artcommonlib.bigquery.BigQueryClient'):
        with patch('artcommonlib.redis.get_value', return_value=None):
            with patch('artcommonlib.redis.set_value'):
                app_instance = KonfluxBuildHistory()

                captured_where = {}

                async def capture_where(**kwargs):
                    captured_where.update(kwargs.get('where', {}))
                    return
                    yield  # Make this a generator

                with patch('app.KonfluxDb') as mock_db:
                    mock_instance = MagicMock()
                    mock_instance.bind = MagicMock()
                    mock_instance.search_builds_by_fields = MagicMock(side_effect=capture_where)
                    mock_db.return_value = mock_instance

                    params = {
                        'group': 'openshift-4.15',
                        'assembly': 'stream',
                        'engine': 'konflux',
                        'record_id': 'abc123',
                        'dateRange': '2024-01-15',
                    }
                    outcomes = ['success', 'failure']
                    await app_instance.query(params, outcomes=outcomes)

                    # Verify where clauses
                    assert captured_where['group'] == 'openshift-4.15'
                    assert captured_where['assembly'] == 'stream'
                    assert captured_where['engine'] == 'konflux'
                    assert captured_where['record_id'] == 'abc123'
                    assert captured_where['outcome'] == ['success', 'failure']


@pytest.mark.asyncio
async def test_query_extra_patterns():
    """
    Test that search patterns are properly configured for pattern matching fields.
    """
    from app import KonfluxBuildHistory

    with patch('artcommonlib.bigquery.BigQueryClient'):
        with patch('artcommonlib.redis.get_value', return_value=None):
            with patch('artcommonlib.redis.set_value'):
                app_instance = KonfluxBuildHistory()

                captured_patterns = {}

                async def capture_patterns(**kwargs):
                    captured_patterns.update(kwargs.get('extra_patterns', {}))
                    return
                    yield  # Make this a generator

                with patch('app.KonfluxDb') as mock_db:
                    mock_instance = MagicMock()
                    mock_instance.bind = MagicMock()
                    mock_instance.search_builds_by_fields = MagicMock(side_effect=capture_patterns)
                    mock_db.return_value = mock_instance

                    params = {
                        'name': 'openshift-cli',
                        'source_repo': 'openshift/oc',
                        'commitish': 'abc123',
                        'nvr': 'openshift-cli-4.15.0',
                        'dateRange': '2024-01-15',
                    }
                    await app_instance.query(params)

                    # Verify extra patterns
                    assert captured_patterns['name'] == 'openshift-cli'
                    assert captured_patterns['source_repo'] == 'openshift/oc'
                    assert captured_patterns['commitish'] == '^abc123'
                    assert captured_patterns['nvr'] == 'openshift-cli-4.15.0'
