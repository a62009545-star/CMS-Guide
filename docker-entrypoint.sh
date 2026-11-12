#!/bin/sh
# Mounted volumes (Docker volumes, Render disks) are often owned by root. Make the upload
# directory writable for the unprivileged "node" user, then drop root before starting the app.
set -e
if [ "$(id -u)" = "0" ]; then
  mkdir -p "${LOCAL_UPLOAD_DIR:-/app/uploads}"
  chown -R node:node "${LOCAL_UPLOAD_DIR:-/app/uploads}"
  exec su-exec node "$@"
fi
exec "$@"
