# Use Node.js version 20
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy your package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your backend code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Tell the container how to start your server
CMD ["node", "src/server.js"]