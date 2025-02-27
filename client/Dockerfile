# Use an official Node runtime as the base image.
FROM node:18

# Set the working directory in the container.
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory.
COPY  package.json ./

# Install the dependencies.
RUN npm install

# Copy the rest of the application source code.
COPY . .

# Expose the port your app runs on (adjust if necessary).
EXPOSE 5173

# Run the app in development mode.
CMD ["npm", "run", "dev"]
