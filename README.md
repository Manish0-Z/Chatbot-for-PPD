# Express.js Authentication API

A robust Express.js API with JWT authentication, MongoDB integration, and user management.

## Features

- User registration and authentication
- JWT token-based authentication
- Protected routes and role-based access control
- MongoDB integration with Mongoose
- Error handling middleware
- Environment variable configuration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn package manager

## Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd <your-project-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=24h
CORS_ORIGIN=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication Routes

- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user (Protected)

### Request Examples

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"123456"}'
```

#### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"123456"}'
```

#### Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Protected routes with middleware
- CORS enabled
- Environment variables for sensitive data

## Error Handling

The API includes comprehensive error handling for:
- Validation errors
- Authentication errors
- Database errors
- Server errors

## Development

To start the development server with hot reload:
```bash
npm run dev
```

## Production

To start the production server:
```bash
npm start
```

## License

MIT

# Postpartum Support Chatbot

## Project Overview
This project implements a conversational chatbot designed to provide support to women in the postpartum period. The chatbot guides users through a series of questions to assess their mental health status and provides personalized recommendations based on their responses.

## Recent Improvements

### Chatbot Interface Enhancements
1. **Fixed Repetitive Greeting Issue**: Resolved a problem where the chatbot would repeatedly display the greeting message instead of progressing through the conversation flow.
2. **Improved HTML Report Rendering**: Updated the client-side code to properly render HTML content in the chat interface, allowing for rich formatting of the assessment report.
3. **Added Dedicated Styling**: Created a specialized CSS file for the report output, improving readability and visual appeal.

### Report Formatting Improvements
1. **Enhanced Visual Layout**: Redesigned the postpartum assessment report with clear sections, better typography, and visual hierarchy.
2. **Risk Level Indicators**: Added color-coded indicators for risk levels (low, moderate, high) to highlight important information.
3. **Responsive Design**: Ensured the report displays correctly on various screen sizes.
4. **Print Functionality**: Added print-specific styling to allow users to easily print their assessment report.

### Technical Implementation
1. **HTML Content Handling**: Modified the client-side message handling to detect and properly render HTML content from the server.
2. **Server-Side Report Generation**: Updated the report generation logic to produce semantically structured HTML with appropriate CSS classes.
3. **Session Management**: Improved the handling of chat sessions to ensure proper conversation flow.

## Usage
1. Navigate to the chat interface
2. Answer the chatbot's questions about your postpartum experience
3. Receive a personalized assessment report with recommendations
4. Save or print your report for future reference or to share with healthcare providers

## Technical Details
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Session Management**: Server-side state with client-side session ID tracking
- **Report Generation**: Dynamic HTML content with CSS styling
