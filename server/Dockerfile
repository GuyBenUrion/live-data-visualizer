FROM python:3.10-slim

# Set the working directory.
WORKDIR /app

# Copy all application source code into the container.
COPY . .

# Install Python dependencies.
# (Ensure that you have these packages in your requirements, or install them explicitly.)
RUN pip3 install --no-cache-dir aiohttp aiohttp_cors

# Expose the ports used by your apps.
EXPOSE 8080 

# Start the application using the startup script.
CMD ["python3", "./server.py"]