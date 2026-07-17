#!/bin/sh
set -e

# If GEMINIAPIKEY is provided, inject it into the compiled index.html
if [ -n "$GEMINIAPIKEY" ]; then
    echo "Injecting runtime GEMINIAPIKEY into index.html..."
    sed -i "s|__GEMINIAPIKEY_PLACEHOLDER__|${GEMINIAPIKEY}|g" /usr/share/nginx/html/index.html
fi

# Execute Nginx
exec nginx -g "daemon off;"
