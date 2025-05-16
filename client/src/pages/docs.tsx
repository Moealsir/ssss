import { DashboardLayout } from "@/components/dashboard/layout";
import { CodeBlock } from "@/components/dashboard/code-block";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquareText, 
  FileImage, 
  CornerDownRight, 
  Users, 
  Key, 
  Webhook,
  FileText 
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Docs() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Base URL for API examples
  const baseUrl = `${window.location.protocol}//${window.location.host}`;

  // Generate curl examples for different endpoints
  const sendMessageCurl = `curl -X POST ${baseUrl}/api/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionId": "wa_123", 
    "to": "+1234567890", 
    "text": "Hello from the WhatsApp API Gateway!"
  }'`;

  const sendMediaCurl = `curl -X POST ${baseUrl}/api/send-media \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionId": "wa_123", 
    "to": "+1234567890", 
    "mediaUrl": "https://example.com/image.jpg",
    "caption": "Check out this image!"
  }'`;

  const replyMessageCurl = `curl -X POST ${baseUrl}/api/reply \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionId": "wa_123", 
    "messageId": "msg_abc", 
    "text": "This is a reply to your message"
  }'`;

  const sendGroupMessageCurl = `curl -X POST ${baseUrl}/api/send-group \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionId": "wa_123", 
    "groupId": "xyz", 
    "text": "Hello everyone in this group!"
  }'`;

  const getGroupMembersCurl = `curl -X GET "${baseUrl}/api/groups/xyz/members?sessionId=wa_123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

  // Generate Node.js examples
  const sendMessageNode = `const axios = require('axios');

async function sendWhatsAppMessage() {
  try {
    const response = await axios.post('${baseUrl}/api/send', {
      sessionId: 'wa_123',
      to: '+1234567890',
      text: 'Hello from the WhatsApp API Gateway!'
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
  }
}

sendWhatsAppMessage();`;

  const sendMediaNode = `const axios = require('axios');

async function sendWhatsAppMedia() {
  try {
    const response = await axios.post('${baseUrl}/api/send-media', {
      sessionId: 'wa_123',
      to: '+1234567890',
      mediaUrl: 'https://example.com/image.jpg',
      caption: 'Check out this image!'
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Media sent:', response.data);
  } catch (error) {
    console.error('Error sending media:', error.response?.data || error.message);
  }
}

sendWhatsAppMedia();`;

  // Generate Python examples
  const sendMessagePython = `import requests
import json

def send_whatsapp_message():
    url = "${baseUrl}/api/send"
    headers = {
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    }
    payload = {
        "sessionId": "wa_123",
        "to": "+1234567890",
        "text": "Hello from the WhatsApp API Gateway!"
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        print("Message sent:", response.json())
    else:
        print("Error sending message:", response.text)

if __name__ == "__main__":
    send_whatsapp_message()`;

  const sendMediaPython = `import requests
import json

def send_whatsapp_media():
    url = "${baseUrl}/api/send-media"
    headers = {
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    }
    payload = {
        "sessionId": "wa_123",
        "to": "+1234567890",
        "mediaUrl": "https://example.com/image.jpg",
        "caption": "Check out this image!"
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        print("Media sent:", response.json())
    else:
        print("Error sending media:", response.text)

if __name__ == "__main__":
    send_whatsapp_media()`;

  // Webhook example payload
  const webhookExamplePayload = `{
  "userId": 123,
  "sessionId": "wa_6fb2e07593",
  "eventType": "message_received",
  "timestamp": "2023-09-15T14:30:45.123Z",
  "message": {
    "id": "msg_54ad7c8e29",
    "body": "Hello, how are you?",
    "from": "+1234567890",
    "fromName": "John Doe",
    "timestamp": "2023-09-15T14:30:42.000Z",
    "hasMedia": false,
    "isGroup": false
  }
}`;

  // Webhook handler example (Express.js)
  const webhookHandlerNode = `// Express.js webhook handler example
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const app = express();

app.use(bodyParser.json());

// Verify webhook signature (if you set a webhook secret)
function verifySignature(req, secret) {
  const signature = req.headers['x-signature'];
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

app.post('/webhook', (req, res) => {
  // If you have a webhook secret
  const webhookSecret = 'your_webhook_secret';
  if (!verifySignature(req, webhookSecret)) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = req.body;
  console.log('Received webhook event:', event.eventType);
  
  // Handle different event types
  switch(event.eventType) {
    case 'message_received':
      console.log('New message from:', event.message.from);
      console.log('Message:', event.message.body);
      break;
    case 'message_delivered':
      console.log('Message delivered:', event.message.id);
      break;
    case 'message_read':
      console.log('Message read:', event.message.id);
      break;
    default:
      console.log('Unknown event type:', event.eventType);
  }
  
  // Always respond with 200 OK to acknowledge receipt
  res.status(200).send('Event received');
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});`;

  return (
    <DashboardLayout 
      user={user} 
      onLogout={logout}
      title="API Documentation"
    >
      <div className="flex flex-col space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-md p-6">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">WhatsApp API Gateway</h1>
            <p className="text-gray-600 dark:text-gray-400">
              This documentation provides information on how to use the WhatsApp API Gateway to send messages, 
              handle webhooks, and manage your WhatsApp connections programmatically.
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="bg-white dark:bg-gray-800 shadow rounded-md p-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <FileText className="h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="authentication" className="flex items-center gap-1">
                <Key className="h-4 w-4" /> Authentication
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-1">
                <MessageSquareText className="h-4 w-4" /> Messages
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-1">
                <FileImage className="h-4 w-4" /> Media
              </TabsTrigger>
              <TabsTrigger value="replies" className="flex items-center gap-1">
                <CornerDownRight className="h-4 w-4" /> Replies
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-1">
                <Users className="h-4 w-4" /> Groups
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="flex items-center gap-1">
                <Webhook className="h-4 w-4" /> Webhooks
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow rounded-md p-6">
            <TabsContent value="overview" className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">API Overview</h2>
              <p className="text-gray-600 dark:text-gray-400">
                The WhatsApp API Gateway provides a simple RESTful API to interact with WhatsApp. You can send messages,
                media files, reply to messages, and manage group conversations programmatically.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">Base URL</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All API endpoints are relative to the base URL:
              </p>
              <code className="block bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-sm mt-2">
                {baseUrl}
              </code>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">Response Format</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All API responses are returned in JSON format with appropriate HTTP status codes.
                Successful responses have a status code of 200 OK and follow this general structure:
              </p>
              <CodeBlock
                code={`{
  "success": true,
  "messageId": "msg_abc123",
  "timestamp": "2023-09-15T14:30:45.123Z"
}`}
                language="json"
              />
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">Error Handling</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Error responses include an error message and an appropriate HTTP status code:
              </p>
              <CodeBlock
                code={`{
  "message": "WhatsApp session not found"
}`}
                language="json"
              />
              
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 mt-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                      <strong>Important:</strong> Before using any API endpoints, you must have:
                    </p>
                    <ul className="mt-2 list-disc pl-5 text-sm text-yellow-700 dark:text-yellow-200">
                      <li>Created an API key in the dashboard</li>
                      <li>Connected at least one WhatsApp account</li>
                      <li>Noted the sessionId of your WhatsApp connection</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="authentication" className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Authentication</h2>
              <p className="text-gray-600 dark:text-gray-400">
                All API requests require authentication using an API key. API keys are associated with your account
                and can be created, viewed, and revoked in the API Keys section of the dashboard.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">API Key Authentication</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Include your API key in the Authorization header using the Bearer authentication scheme:
              </p>
              <CodeBlock
                code={`Authorization: Bearer YOUR_API_KEY`}
                language="http"
              />
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">API Key Security</h3>
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <p>For security, follow these best practices when using API keys:</p>
                <ul className="list-disc pl-5">
                  <li>Keep your API key secure and never share it publicly</li>
                  <li>Use different API keys for different applications or environments</li>
                  <li>Set expiry dates for API keys when possible</li>
                  <li>Revoke API keys that are no longer needed</li>
                  <li>Monitor API key usage in the dashboard</li>
                </ul>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">Rate Limiting</h3>
              <p className="text-gray-600 dark:text-gray-400">
                API requests are subject to rate limiting to ensure fair usage and system stability.
                Rate limits are configured per API key and can be viewed in the dashboard.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                When rate limits are exceeded, the API will return a 429 Too Many Requests response.
                Implement exponential backoff in your code to handle rate limiting gracefully.
              </p>
            </TabsContent>
            
            <TabsContent value="messages" className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Sending Messages</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Send text messages to WhatsApp contacts or groups using the messages API.
              </p>
              
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Send a Text Message</CardTitle>
                    <CardDescription>POST /api/send</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Send a simple text message to a WhatsApp contact.
                    </p>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Request Body:</h4>
                    <CodeBlock
                      code={`{
  "sessionId": "wa_123",   // Your WhatsApp session ID
  "to": "+1234567890",     // Recipient's phone number
  "text": "Hello world!"   // Message content
}`}
                      language="json"
                    />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-1">Response:</h4>
                    <CodeBlock
                      code={`{
  "success": true,
  "messageId": "msg_abc123",
  "timestamp": "2023-09-15T14:30:45.123Z"
}`}
                      language="json"
                    />
                  </CardContent>
                  <CardFooter>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Example (cURL):</h4>
                      <div className="max-h-40 overflow-y-auto">
                        <CodeBlock code={sendMessageCurl} />
                      </div>
                    </div>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Code Examples</CardTitle>
                    <CardDescription>Node.js and Python</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Node.js Example:</h4>
                      <div className="max-h-60 overflow-y-auto">
                        <CodeBlock
                          code={sendMessageNode}
                          language="javascript"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Python Example:</h4>
                      <div className="max-h-60 overflow-y-auto">
                        <CodeBlock
                          code={sendMessagePython}
                          language="python"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-600 p-4 mt-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      <strong>Tip:</strong> For phone numbers, always include the country code with the plus symbol 
                      (e.g., +1234567890). WhatsApp requires the full international format.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="media" className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Sending Media</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Send images, videos, documents, and other media files to WhatsApp contacts or groups.
              </p>
              
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Send Media Message</CardTitle>
                    <CardDescription>POST /api/send-media</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Send media files (images, videos, documents) to a WhatsApp contact.
                    </p>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Request Body:</h4>
                    <CodeBlock
                      code={`{
  "sessionId": "wa_123",         // Your WhatsApp session ID
  "to": "+1234567890",           // Recipient's phone number
  "mediaUrl": "https://...",     // URL of the media file
  "caption": "Check this out!"   // Optional caption (for images/videos)
}`}
                      language="json"
                    />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-1">Response:</h4>
                    <CodeBlock
                      code={`{
  "success": true,
  "messageId": "msg_def456",
  "timestamp": "2023-09-15T14:35:12.456Z"
}`}
                      language="json"
                    />
                  </CardContent>
                  <CardFooter>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Example (cURL):</h4>
                      <div className="max-h-40 overflow-y-auto">
                        <CodeBlock code={sendMediaCurl} />
                      </div>
                    </div>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Code Examples</CardTitle>
                    <CardDescription>Node.js and Python</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Node.js Example:</h4>
                      <div className="max-h-60 overflow-y-auto">
                        <CodeBlock
                          code={sendMediaNode}
                          language="javascript"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Python Example:</h4>
                      <div className="max-h-60 overflow-y-auto">
                        <CodeBlock
                          code={sendMediaPython}
                          language="python"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-600 p-4 mt-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 space-y-1">
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      <strong>Media Guidelines:</strong>
                    </p>
                    <ul className="list-disc pl-5 text-sm text-blue-700 dark:text-blue-200">
                      <li>The media URL must be publicly accessible</li>
                      <li>Supported file types: jpg, jpeg, png, gif, pdf, doc(x), xls(x), zip, mp3, mp4</li>
                      <li>Maximum file size: 16MB for media, 100MB for documents</li>
                      <li>Media files are temporarily cached and automatically deleted after 24 hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="replies" className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Message Replies</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Reply to specific WhatsApp messages using their message ID.
              </p>
              
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reply to a Message</CardTitle>
                    <CardDescription>POST /api/reply</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Reply to a specific WhatsApp message using its message ID. The reply will be displayed as a quote reply in WhatsApp.
                    </p>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Request Body:</h4>
                    <CodeBlock
                      code={`{
  "sessionId": "wa_123",     // Your WhatsApp session ID
  "messageId": "msg_abc",    // ID of the message to reply to
  "text": "Reply text"       // Reply message content
}`}
                      language="json"
                    />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-1">Response:</h4>
                    <CodeBlock
                      code={`{
  "success": true,
  "messageId": "msg_ghi789",
  "timestamp": "2023-09-15T14:40:22.789Z"
}`}
                      language="json"
                    />
                  </CardContent>
                  <CardFooter>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Example (cURL):</h4>
                      <CodeBlock code={replyMessageCurl} />
                    </div>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 mt-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                      <strong>Important:</strong> To reply to a message, you need its message ID. Message IDs are included in webhook events
                      when you receive a message, or in the response when you send a message.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="groups" className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Group Management</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Send messages to groups and manage group information.
              </p>
              
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Send Group Message</CardTitle>
                    <CardDescription>POST /api/send-group</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Send a text message to a WhatsApp group.
                    </p>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Request Body:</h4>
                    <CodeBlock
                      code={`{
  "sessionId": "wa_123",   // Your WhatsApp session ID
  "groupId": "xyz",        // Group ID
  "text": "Hello group!"   // Message content
}`}
                      language="json"
                    />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-1">Response:</h4>
                    <CodeBlock
                      code={`{
  "success": true,
  "messageId": "msg_jkl012",
  "timestamp": "2023-09-15T14:45:33.123Z"
}`}
                      language="json"
                    />
                  </CardContent>
                  <CardFooter>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Example (cURL):</h4>
                      <CodeBlock code={sendGroupMessageCurl} />
                    </div>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Get Group Members</CardTitle>
                    <CardDescription>GET /api/groups/{"{groupId}"}/members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Retrieve a list of members in a WhatsApp group.
                    </p>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Query Parameters:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                      <li><code>sessionId</code> (required): Your WhatsApp session ID</li>
                    </ul>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-1">Response:</h4>
                    <CodeBlock
                      code={`{
  "success": true,
  "groupId": "xyz",
  "members": [
    {
      "id": "12345@c.us",
      "name": "John Doe",
      "isAdmin": true
    },
    {
      "id": "67890@c.us",
      "name": "Jane Smith",
      "isAdmin": false
    },
    // More members...
  ]
}`}
                      language="json"
                    />
                  </CardContent>
                  <CardFooter>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Example (cURL):</h4>
                      <CodeBlock code={getGroupMembersCurl} />
                    </div>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-600 p-4 mt-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      <strong>Note:</strong> To use group functions, your WhatsApp account must be a member of the group.
                      Group IDs are typically in the format <code>[phone-number]-[timestamp]@g.us</code>.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="webhooks" className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Webhooks</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Receive real-time notifications about WhatsApp events via webhooks.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">Webhook Events</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Configure webhooks in the dashboard to receive events for:
              </p>
              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                <li><strong>message_received</strong> - When a new message is received</li>
                <li><strong>message_delivered</strong> - When a message you sent has been delivered</li>
                <li><strong>message_read</strong> - When a message you sent has been read</li>
                <li><strong>all</strong> - All of the above events</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">Webhook Payload</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Example webhook payload for a received message:
              </p>
              <CodeBlock
                code={webhookExamplePayload}
                language="json"
              />
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">Webhook Security</h3>
              <p className="text-gray-600 dark:text-gray-400">
                When you configure a webhook with a secret, all webhook requests will include an <code>X-Signature</code> header.
                This header contains an HMAC SHA-256 signature of the request body, signed with your webhook secret.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                You should validate this signature in your webhook handler to ensure the request is authentic.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">Example Webhook Handler</h3>
              <div className="max-h-80 overflow-y-auto">
                <CodeBlock
                  code={webhookHandlerNode}
                  language="javascript"
                />
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-600 p-4 mt-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      <strong>Best Practices:</strong>
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-blue-700 dark:text-blue-200">
                      <li>Always respond quickly with a 200 OK status to acknowledge receipt</li>
                      <li>Process webhook events asynchronously to avoid timeouts</li>
                      <li>Implement exponential backoff for retries on your end</li>
                      <li>Use the Test Webhook button in the dashboard to verify your endpoint</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
