#!/bin/sh
set -eu

: "${API_URL:?API_URL manquante}"
export STAGING_AUTH="${STAGING_AUTH:-}"

envsubst '${API_URL} ${STAGING_AUTH}' < /etc/dramatoons/config.js.template > /usr/share/nginx/html/config.js
