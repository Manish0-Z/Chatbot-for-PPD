# MongoDB Setup Guide for MOM Application

This guide will help you set up and connect to MongoDB for the MOM (Maternal Online Medical-assistant) application.

## Prerequisites

- Node.js and npm installed
- A MongoDB Atlas account (free tier works fine)

## Setting Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up or log in
2. Create a new project (or use an existing one)
3. Create a new cluster (free tier is sufficient)
4. Set up a database user:
   - Go to Database Access → Add New Database User
   - Create a username and password (Save these credentials!)
   - Select appropriate privileges (Read and write to any database is sufficient for development)

5. Whitelist your IP address:
   - Go to Network Access → Add IP Address
   - Add your current IP or use 0.0.0.0/0 for development (not recommended for production)

6. Get your connection string:
   - Go to Clusters → Connect → Connect your application
   - Copy the provided connection string

## Configuring the Application

1. Create a `.env` file in the root directory of the project
2. Add the following entries:

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
```

3. Replace:
   - `<username>` with your MongoDB Atlas username
   - `<password>` with your MongoDB Atlas password
   - `<cluster>` with your cluster address
   - `<dbname>` with your database name (e.g., "momapp")
   - `your_jwt_secret_key` with a strong secret for JWT authentication

## Testing the Connection

Run the test connection script:

```
node test-db-connection.js
```

If successful, you should see a message confirming the connection.

## Troubleshooting Common Issues

### Connection Refused
- Check if your IP is whitelisted in MongoDB Atlas Network Access
- Verify your connection string is correct

### Authentication Failed
- Check if username and password in the connection string are correct
- Ensure the user has the necessary permissions

### Cannot Find Module 'mongoose'
- Run `npm install mongoose` to install the required package

### JWT Authentication Issues
- Ensure JWT_SECRET and JWT_EXPIRE are properly set in your .env file

## Using MongoDB Compass (Optional)

MongoDB Compass is a graphical user interface for MongoDB that makes it easier to explore and manipulate your data:

1. Download and install [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Use your connection string to connect to your database
3. Explore collections, documents, and run queries graphically

## Need More Help?

If you're still experiencing issues, please:

1. Check the server logs for specific error messages
2. Ensure all environment variables are correctly set
3. Verify that your MongoDB Atlas account is active and not restricted