FROM httpd:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# This project is a static site (Vanilla JS).
# package.json is used only for dev dependencies (jsdom) and does not contain build scripts.
# Therefore, we directly serve the source files via Apache.
# The content is filtered by .dockerignore to exclude sensitive files and dev config.

COPY . /usr/local/apache2/htdocs/

# Expose port 80
EXPOSE 80
