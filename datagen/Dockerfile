# Use an official Node runtime as the base image.
FROM node:18

# Set the working directory in the container.
WORKDIR /app

# Copy the rest of the application source code.
COPY . .

# Expose the port your app runs on (adjust if necessary).
EXPOSE 9000

# Run the app in development mode.
CMD ["node", "datagen.js"]
