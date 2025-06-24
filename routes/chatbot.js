import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory to store session data
const TEMP_DIR = path.join(__dirname, '..', 'temp');

// Create temp directory if it doesn't exist
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Flag to use Python Gemini chatbot - Set to true to use the Python implementation
const USE_PYTHON_CHATBOT = true;

// Function to get the session file path
function getSessionFilePath(sessionId) {
    return path.join(TEMP_DIR, `state_${sessionId}.json`);
}

// Route to get initial greeting
router.get('/greeting', async (req, res) => {
    try {
        const sessionId = uuidv4();
        console.log(`Generated new session ID for greeting: ${sessionId}`);
        
        if (USE_PYTHON_CHATBOT) {
            try {
                // Path to Python script
                const pythonScript = path.join(__dirname, '..', 'chatbot', 'chatbot.py');
                
                // Create a promise to handle the Python process
                const pythonResponse = new Promise((resolve, reject) => {
                    let output = '';
                    let error = '';
                    
                    // Spawn Python process with --first-run flag
                    const pythonProcess = spawn('python', [
                        pythonScript,
                        '--first-run',
                        '--user', sessionId
                    ]);
                    
                    // Collect output
                    pythonProcess.stdout.on('data', (data) => {
                        output += data.toString();
                    });
                    
                    // Collect errors
                    pythonProcess.stderr.on('data', (data) => {
                        error += data.toString();
                    });
                    
                    // Handle process completion
                    pythonProcess.on('close', (code) => {
                        if (code === 0) {
                            resolve(output.trim());
                        } else {
                            console.error(`Python process error: ${error}`);
                            reject(new Error('Python process failed'));
                        }
                    });
                    
                    // Handle process errors
                    pythonProcess.on('error', (err) => {
                        console.error(`Failed to start Python process: ${err}`);
                        reject(err);
                    });
                    
                    // Set timeout
                    setTimeout(() => {
                        pythonProcess.kill();
                        reject(new Error('Python process timed out'));
                    }, 5000); // 5 second timeout
                });
                
                // Wait for Python response
                const response = await pythonResponse;
                
                // Send response
                res.json({ 
                    sessionId, 
                    response: response
                });
                
            } catch (pythonError) {
                console.error('Python chatbot failed:', pythonError);
                res.status(500).json({ 
                    error: 'An error occurred while getting the greeting.',
                    message: "I'm sorry, I couldn't initialize the chat. Please try again."
                });
            }
        } else {
            res.status(500).json({ 
                error: 'Chatbot service is currently unavailable.',
                message: "I'm sorry, the chatbot service is currently unavailable. Please try again later."
            });
        }
    } catch (error) {
        console.error('Error getting greeting:', error);
        res.status(500).json({ 
            error: 'An error occurred while getting the greeting.',
            message: "I'm sorry, I couldn't initialize the chat. Please try again."
        });
    }
});

// Route to handle chat messages
router.post('/message', async (req, res) => {
    try {
        const { message } = req.body;
        let sessionId = req.headers['x-session-id'];
        
        console.log(`==== PROCESSING MESSAGE REQUEST ====`);
        console.log(`Session ID: ${sessionId}`);
        console.log(`Message: "${message}"`);
        
        // Generate new session ID if not provided
        if (!sessionId) {
            sessionId = uuidv4();
            console.log(`Generated new session ID: ${sessionId}`);
        }
        
        // Use Python Gemini chatbot
        if (USE_PYTHON_CHATBOT) {
            try {
                // Path to Python script
                const pythonScript = path.join(__dirname, '..', 'chatbot', 'chatbot.py');
                console.log(`Python script path: ${pythonScript}`);
                
                // Save message to temporary file
                const messageFile = path.join(TEMP_DIR, `message_${sessionId}.txt`);
                fs.writeFileSync(messageFile, message, 'utf8');
                console.log(`Saved message to file: ${messageFile}`);
                
                // Log file contents for verification
                const fileContents = fs.readFileSync(messageFile, 'utf8');
                console.log(`Verified file contents: "${fileContents}"`);
                
                console.log(`Launching Python process...`);
                
                // Create a promise to handle the Python process
                const pythonResponse = new Promise((resolve, reject) => {
                    let output = '';
                    let error = '';
                    
                    // Build command with arguments for logging
                    const args = [
                        pythonScript,
                        '--user', sessionId,
                        '--message-file', messageFile
                    ];
                    console.log(`Command: python ${args.join(' ')}`);
                    
                    // Spawn Python process
                    const pythonProcess = spawn('python', args);
                    
                    // Collect output
                    pythonProcess.stdout.on('data', (data) => {
                        const chunk = data.toString();
                        output += chunk;
                        console.log(`Python stdout: "${chunk}"`);
                    });
                    
                    // Collect errors
                    pythonProcess.stderr.on('data', (data) => {
                        const chunk = data.toString();
                        error += chunk;
                        console.error(`Python stderr: "${chunk}"`);
                    });
                    
                    // Handle process completion
                    pythonProcess.on('close', (code) => {
                        console.log(`Python process exited with code ${code}`);
                        
                        // Clean up message file
                        try {
                            fs.unlinkSync(messageFile);
                            console.log(`Removed message file: ${messageFile}`);
                        } catch (err) {
                            console.error(`Error deleting message file: ${err}`);
                        }
                        
                        if (code === 0) {
                            if (!output.trim()) {
                                console.log(`Warning: Python process returned empty output`);
                                resolve("I'm here to help. What would you like to know?");
                            } else {
                                resolve(output.trim());
                            }
                        } else {
                            console.error(`Python process error (code ${code}): ${error}`);
                            reject(new Error(`Python process failed with code ${code}`));
                        }
                    });
                    
                    // Handle process errors
                    pythonProcess.on('error', (err) => {
                        console.error(`Failed to start Python process: ${err}`);
                        reject(err);
                    });
                    
                    // Set timeout
                    setTimeout(() => {
                        pythonProcess.kill();
                        console.error(`Python process timed out after 5 seconds`);
                        reject(new Error('Python process timed out'));
                    }, 5000); // 5 second timeout
                });
                
                // Wait for Python response
                const response = await pythonResponse;
                console.log(`Python response received: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"`);
                
                // Send response
                console.log(`Sending response to client for session ${sessionId}`);
                res.json({ 
                    sessionId, 
                    response: response
                });
                
            } catch (pythonError) {
                console.error(`Python chatbot failed: ${pythonError.stack || pythonError}`);
                res.json({ 
                    sessionId,
                    response: "I'm sorry, I couldn't process your request. Could you try again?"
                });
            }
        } else {
            console.log(`Python chatbot is disabled`);
            res.json({ 
                sessionId,
                response: "I'm sorry, the chatbot service is currently unavailable. Please try again later."
            });
        }
    } catch (error) {
        console.error(`Error processing message: ${error.stack || error}`);
        res.json({ 
            error: 'An error occurred while processing your message.',
            response: "I'm sorry, I couldn't process your request. Please try again."
        });
    }
});

export default router; 