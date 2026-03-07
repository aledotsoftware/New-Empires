FROM public.ecr.aws/docker/library/node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies (if any)
RUN npm install --production

# Copy all source files
COPY . .

# Environment setup
ENV NODE_ENV=production
ENV PORT=3000

# Expose port (documentary)
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
