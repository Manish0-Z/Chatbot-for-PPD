# Postpartum Care Platform

A comprehensive platform for postpartum care with a Node.js backend and Python chatbot.

## Features

- User authentication (signup, login, profile management)
- AI-powered chatbot for postpartum care guidance using Google Gemini API
- Responsive UI for all devices

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT Authentication
- Python (for chatbot)

### Frontend
- HTML5
- CSS3
- JavaScript

## Setup Instructions

1. Clone the repository
2. Install Node.js dependencies:
   ```
   npm install
   ```
3. Install Python dependencies:
   ```
   pip install google-generativeai
   ```
4. Create a `.env` file with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/postpartum-care-platform
   JWT_SECRET=your_jwt_secret
   GOOGLE_API_KEY=AIzaSyARBMUYTSXizEtyK1QjJ5sR_GGxChi5EIY
   ```
5. Start the server:
   ```
   npm start
   ```
   or for development:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login a user
- GET `/api/auth/user` - Get current user data

### Chatbot
- POST `/api/chatbot/message` - Send a message to the chatbot

## License

MIT

## Author

Your Name
