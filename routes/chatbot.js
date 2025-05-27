import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Track conversation session IDs
const sessions = {};

// Direct method to get chatbot response using Python script
const getChatbotResponse = async (message, sessionId) => {
  return new Promise((resolve, reject) => {
    try {
      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        try {
          fs.mkdirSync(tempDir, { recursive: true, mode: 0o755 });
          console.log(`[DEBUG] Created temp directory: ${tempDir}`);
        } catch (err) {
          console.error(`[ERROR] Failed to create temp directory: ${err.message}`);
        }
      }
      
      // Create input and output files for the chatbot
      const inputFile = path.join(tempDir, `input_${sessionId}.txt`);
      const outputFile = path.join(tempDir, `output_${sessionId}.txt`);
      
      // Write the user message to the input file
      fs.writeFileSync(inputFile, message);
      
      // Log the session ID being passed
      console.log(`[DEBUG] Processing message for session ID: ${sessionId}`);
      console.log(`[DEBUG] Message: "${message}"`);
      
      // Convert Windows backslashes to forward slashes for Python
      const chatbotPath = path.join(__dirname, '..', 'chatbot', 'chatbot.py');
      console.log(`[DEBUG] Python script path: ${chatbotPath}`);
      
      // Create a session state file to persist conversation state
      const stateFile = path.join(tempDir, `state_${sessionId}.json`);
      if (!fs.existsSync(stateFile)) {
        fs.writeFileSync(stateFile, JSON.stringify({
          id: sessionId,
          createdAt: new Date().toISOString(),
          step: 'greeting',
          name: null,
          age: null,
          problem: null,
          symptoms: null,
          details: null,
          responses: {}
        }));
        console.log(`[DEBUG] Created new state file for session: ${sessionId}`);
      }
      
      // Execute the python chatbot script
      const pythonProcess = spawn('python', [
        chatbotPath,
        '--input', inputFile,
        '--output', outputFile,
        '--user', sessionId,
        '--debug'
      ]);
      
      pythonProcess.on('error', (error) => {
        console.error(`[ERROR] Failed to start Python process: ${error.message}`);
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
      
      let errorData = '';
      
      // Collect stderr for debugging
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
        console.log(`[DEBUG] Python stderr: ${data.toString()}`);
      });
      
      pythonProcess.on('close', (code) => {
        console.log(`[DEBUG] Python process exited with code ${code}`);
        
        if (code !== 0) {
          console.error(`[ERROR] Python process exited with code ${code}`);
          console.error(`[ERROR] Error output: ${errorData}`);
          reject(new Error(`Python process exited with code ${code}`));
          return;
        }
        
        // Read the output file
        try {
          if (fs.existsSync(outputFile)) {
            const response = fs.readFileSync(outputFile, 'utf-8');
            console.log(`[DEBUG] Response from chatbot: "${response.substring(0, 100)}..."`);
            
            // Clean up temp files
            try {
              fs.unlinkSync(inputFile);
              fs.unlinkSync(outputFile);
            } catch (err) {
              console.log(`[DEBUG] Error cleaning up temp files: ${err.message}`);
            }
            
            resolve(response);
          } else {
            console.error(`[ERROR] Output file not found: ${outputFile}`);
            reject(new Error('Output file not found'));
          }
        } catch (err) {
          console.error(`[ERROR] Error reading output file: ${err.message}`);
          reject(err);
        }
      });
    } catch (error) {
      console.error('[ERROR] Error in getChatbotResponse:', error);
      reject(error);
    }
  });
};

// Handle chatbot messages
router.post('/message', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }
    
    // Get or create session ID from header or client storage
    let sessionId = req.headers['x-session-id'];
    console.log(`[DEBUG] Raw session ID from request headers: '${sessionId}'`);
    
    // If no session ID or it's 'null' (from localStorage), create a new one
    if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
      sessionId = uuidv4();
      console.log(`[DEBUG] Created new session ID: '${sessionId}'`);
      
      // Initialize the session
      sessions[sessionId] = {
        id: sessionId,
        createdAt: new Date(),
        messages: []
      };
    } else {
      console.log(`[DEBUG] Using existing session ID: '${sessionId}'`);
      console.log(`[DEBUG] Session exists in memory: ${!!sessions[sessionId]}`);
      
      // Ensure the session exists
      if (!sessions[sessionId]) {
        console.log(`[DEBUG] Session not found in memory, creating new session data for ID: '${sessionId}'`);
        sessions[sessionId] = {
          id: sessionId,
          createdAt: new Date(),
          messages: []
        };
      }
    }
    
    // Special handling for "New case" message
    if (message.toLowerCase() === 'new case') {
      // Create a new session ID
      const newSessionId = uuidv4();
      console.log(`[DEBUG] Creating new case with session ID: '${newSessionId}'`);
      
      // Initialize the new session
      sessions[newSessionId] = {
        id: newSessionId,
        createdAt: new Date(),
        messages: []
      };
      
      // Return a welcome message for the new case
      res.json({
        success: true,
        response: "Great! Let's start a new patient record. What's your name?",
        sessionId: newSessionId
      });
      return;
    }
    
    // Add message to session history
    sessions[sessionId].messages.push({
      sender: 'user',
      text: message,
      timestamp: new Date()
    });
    
    // Get response from chatbot with session ID for conversation tracking
    console.log(`[DEBUG] Sending to Python with session ID: '${sessionId}'`);
    const response = await getChatbotResponse(message, sessionId);
    
    // Add bot response to session history
    sessions[sessionId].messages.push({
      sender: 'bot',
      text: response,
      timestamp: new Date()
    });
    
    // Log the total messages in this session
    console.log(`[DEBUG] Session '${sessionId}' now has ${sessions[sessionId].messages.length} messages`);
    
    res.setHeader('Content-Type', 'application/json');
    const responseData = { 
      success: true, 
      response,
      sessionId
    };
    console.log(`[DEBUG] Sending response with sessionId: '${sessionId}'`);
    res.json(responseData);
  } catch (error) {
    console.error('[DEBUG] Chatbot API error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Sorry, I encountered an error processing your message. Please try again' 
    });
  }
});

export default router;