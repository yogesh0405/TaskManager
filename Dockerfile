# Use the official Nginx image based on Alpine Linux for a tiny image size
FROM nginx:alpine

# Copy all static files from your local project directory into Nginx's default public folder
COPY . /usr/share/nginx/html/

# Expose port 80 to allow external access to the web server
EXPOSE 80

# Start Nginx in the foreground so the Docker container stays active
CMD ["nginx", "-g", "daemon off;"]


