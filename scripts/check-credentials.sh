#!/bin/bash

# Check deployment credentials and determine what can be updated.
#
# This script validates available credentials and outputs environment variables
# for ansible to determine which secrets to create/update.
#
# Required:
#     - OPENSHIFT_NAMESPACE (always required)
#
# Optional (will update secrets if provided):
#     - REDIS_PASSWORD (env var)
#     - /tmp/JIRA_EMAIL (file) + /tmp/JIRA_TOKEN (file)
#
# Usage:
#     source scripts/check-credentials.sh
#
# Sets:
#     UPDATE_REDIS_SECRET=true/false
#     UPDATE_JIRA_SECRET=true/false

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Checking deployment credentials..."
echo ""

# OPENSHIFT_NAMESPACE is always required
if [ -z "$OPENSHIFT_NAMESPACE" ]; then
    echo -e "${RED}✗ OPENSHIFT_NAMESPACE not set (REQUIRED)${NC}"
    echo "  Please set it with: export OPENSHIFT_NAMESPACE='your-namespace'"
    echo ""
    return 1 2>/dev/null || exit 1
fi

echo -e "${GREEN}✓ OPENSHIFT_NAMESPACE: $OPENSHIFT_NAMESPACE${NC}"

# Check Redis password
export UPDATE_REDIS_SECRET=false
if [ -n "$REDIS_PASSWORD" ]; then
    echo -e "${GREEN}✓ REDIS_PASSWORD: ${REDIS_PASSWORD:0:10}... (will update secret)${NC}"
    export UPDATE_REDIS_SECRET=true
else
    echo -e "${YELLOW}⚠ REDIS_PASSWORD not set (will use existing secret if available)${NC}"
fi

# Check Jira credentials
export UPDATE_JIRA_SECRET=false
JIRA_EMAIL_AVAILABLE=false
JIRA_TOKEN_AVAILABLE=false

if [ -f /tmp/JIRA_EMAIL ]; then
    export JIRA_EMAIL=$(cat /tmp/JIRA_EMAIL | tr -d '\n')
    JIRA_EMAIL_AVAILABLE=true
fi

if [ -f /tmp/JIRA_TOKEN ]; then
    export JIRA_TOKEN=$(cat /tmp/JIRA_TOKEN | tr -d '\n')
    JIRA_TOKEN_AVAILABLE=true
fi

if [ "$JIRA_EMAIL_AVAILABLE" = true ] && [ "$JIRA_TOKEN_AVAILABLE" = true ]; then
    echo -e "${GREEN}✓ JIRA_EMAIL: $JIRA_EMAIL (will update secret)${NC}"
    echo -e "${GREEN}✓ JIRA_TOKEN: ${JIRA_TOKEN:0:10}... (will update secret)${NC}"
    export UPDATE_JIRA_SECRET=true
elif [ "$JIRA_EMAIL_AVAILABLE" = true ] || [ "$JIRA_TOKEN_AVAILABLE" = true ]; then
    echo -e "${YELLOW}⚠ Incomplete Jira credentials (need both email and token)${NC}"
    if [ "$JIRA_EMAIL_AVAILABLE" = false ]; then
        echo "  Missing: /tmp/JIRA_EMAIL"
    fi
    if [ "$JIRA_TOKEN_AVAILABLE" = false ]; then
        echo "  Missing: /tmp/JIRA_TOKEN"
    fi
    echo "  Will use existing Jira secret if available"
else
    echo -e "${YELLOW}⚠ Jira credentials not provided (will use existing secret if available)${NC}"
fi

echo ""
echo "Deployment plan:"
echo "  Namespace: $OPENSHIFT_NAMESPACE"
echo "  Update Redis secret: $UPDATE_REDIS_SECRET"
echo "  Update Jira secret: $UPDATE_JIRA_SECRET"
echo ""
