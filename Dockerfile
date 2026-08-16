FROM node:20-alpine

WORKDIR /app

# Copy application files
COPY . .

# Environment setup
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]

