const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Server } = require("socket.io");
const { SessionsClient } = require('@google-cloud/dialogflow-cx');
const { v4: uuidv4 } = require('uuid'); // Import the uuid library

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(bodyParser.json());

const projectId = 'chatbot-sinops'; // Replace with your GCP Project ID
const location = 'us-central1'; // The location of your agent
const agentId = 'ebac80b2-6176-43f9-b96d-f4f0aefd1aea'; // Replace with your Dialogflow CX Agent ID
const languageCode = 'en-US'; // Specify the language code here

// Specify the options, including the correct endpoint
const clientOptions = {
  apiEndpoint: 'us-central1-dialogflow.googleapis.com',
};

// Pass the options when creating the SessionsClient instance
const client = new SessionsClient(clientOptions);

let resolveFrontendResponse;
let frontendResponsePromise = new Promise((resolve) => {
  resolveFrontendResponse = resolve;
});
let sessionId;
io.on('connection', (socket) => {
  console.log('A user connected');
  sessionId = uuidv4();

  // Listen for a response from the frontend
  socket.on('frontendProcessed', (data) => {
    console.log('Data processed by the frontend:', data);
    resolveFrontendResponse(data); // Resolve the promise with the data from the frontend
  });
});

app.post('/send-message', async (req, res) => {
  // Generate a new unique session ID for each request
  const text = req.body.message;
console.log('projectId:', projectId);
console.log('location:', location);
console.log('agentId:', agentId);
console.log('sessionId:', sessionId);
  const sessionPath = client.projectLocationAgentSessionPath(
    projectId,
    location,
    agentId,
    sessionId
  );

  // Adjusting the request to match the correct structure for languageCode
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: text,
      },
      languageCode: languageCode, // Correctly placing languageCode
    },
    queryParams: {
      timeZone: "America/Los_Angeles", // Example timezone, adjust as necessary
    },
  };

  try {
    const [response] = await client.detectIntent(request);
    const messages = response.queryResult.responseMessages.map((message) => {
      if (message.text) {
        return message.text.text;
      }
    }).join('\n');

    res.json({ reply: messages });
  } catch (error) {
    console.error('Dialogflow API error:', error);
    res.status(500).send('Error processing your message.');
  }
});

app.post('/webhook', async (req, res) => {
  // Safely extract sessionInfo and its parameters
  const sessionInfo = req.body.sessionInfo;
  const parameters = sessionInfo ? sessionInfo.parameters : {};
  console.log(`parameters: ${parameters?.envname}`);

  // Extract individual parameters
  const applicationName = parameters?.applicationname?.split(' ')?.[0] || 'undefined';
  const clusterName = parameters?.clustername?.split(' ')?.[0] || 'undefined';
  const envName = parameters?.envname?.split(' ')?.[0] || 'undefined';
  const versionNumber = parameters?.versionnumber?.split(' ')?.[1] || 'undefined';

  // Log extracted parameters for debugging
  console.log(`Application Name: ${applicationName}`);
  console.log(`Cluster Name: ${clusterName}`);
  console.log(`Environment Name: ${envName}`);
  console.log(`Version Number: ${versionNumber}`);

  // Your logic here...

  // Example of emitting an event to all connected clients
  io.emit('dialogflowUpdate', {
    applicationName,
    clusterName,
    envName,
    versionNumber,
  });

  const frontendData = await frontendResponsePromise;

  // Step 4: Now you can use frontendData to send the processing status back to Dialogflow
  console.log('Processing status:', frontendData);

  // Example response
  const responseToDialogflow = {
    fulfillmentResponse: {
      messages: [{
        text: {
          text: [`The application ${applicationName} will be upgraded to version ${versionNumber} in the ${clusterName} cluster and ${envName} environment. status is ${JSON.stringify(frontendData)}`]
        }
      }]
    },
  };
  // Send the response back to Dialogflow CX
  res.json(responseToDialogflow);
  // Reset the promise for the next request
  frontendResponsePromise = new Promise((resolve) => {
    resolveFrontendResponse = resolve;
  });
});

app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

// In your Node.js backend
app.post('/api/update-graph', (req, res) => {
  const graphData = req.body;
  // Process or store the graphData as needed
  // console.log(graphData);
  res.json({ message: 'Graph data received successfully!' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});