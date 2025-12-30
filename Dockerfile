FROM public.ecr.aws/docker/library/nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# This project is a static site (Vanilla JS).
# package.json is used only for dev dependencies (jsdom) and does not contain build scripts.
# Therefore, we directly serve the source files via Nginx.
# The content is filtered by .dockerignore to exclude sensitive files and dev config.

COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80
