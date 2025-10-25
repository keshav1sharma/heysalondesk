# Salon HITL (Human-in-the-Loop) System

A complete AI-powered voice agent system with human supervision for StyleGuide Salon customer service. Features semantic knowledge search with Mem0, MongoDB persistence, real-time WebSocket updates, and webhook notifications for external integrations.

## 🏗️ Architecture

```
┌─────────────────────────┐
│   Voice Agent (Python)  │
│   - LiveKit SDK         │
│   - Mem0 Client         │
│   - Semantic KB Search  │
└───────────┬─────────────┘
            │
            │ HTTP/WebSocket
            │
┌───────────▼─────────────┐
│   Backend (Node.js)     │
│   - Express Server      │
│   - MongoDB Driver      │
│   - Mem0 Integration    │
│   - Socket.io           │
└───────────┬─────────────┘
            │
            │ REST API + WebSocket
            │
┌───────────▼─────────────┐
│   Frontend (React)      │
│   - Ant Design UI       │
│   - Real-time Updates   │
└─────────────────────────┘
```

## 🚀 Features

- **Voice Agent**: LiveKit-powered voice agent with GPT-4.1, Deepgram STT, and Cartesia TTS
- **Semantic Search**: Mem0 integration for intelligent knowledge retrieval (no MongoDB fallback)
- **Real-time Updates**: WebSocket notifications for supervisors via Socket.io
- **Webhook Notifications**: POST requests to external webhooks for all events
- **Knowledge Learning**: Automatically builds knowledge base from resolved requests
- **MongoDB Persistence**: Scalable data storage with Mongoose ODM
- **Modern UI**: React + Vite + Ant Design dashboard
- **Background Jobs**: Automatic timeout handling with node-cron (every 5 minutes)
- **Smart Escalation**: AI agent escalates unknown questions to human supervisors

## 📋 Prerequisites

- **Node.js** 18+ (for backend)
- **Python** 3.9+ (for voice agent)
- **MongoDB** (local or Atlas)
- **Mem0 API Key** ([Get one here](https://mem0.ai))
- **OpenAI API Key** (for GPT-4.1)
- **LiveKit Account** (for voice features)
- **Deepgram API Key** (for speech-to-text)
- **Cartesia API Key** (for text-to-speech)
- **Webhook URL** (optional, for external notifications)

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd HeySalonDesk
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials:
# - MONGODB_URI
# - MEM0_API_KEY
# - WEBHOOK_URL (optional)
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Edit if needed (defaults should work)
```

### 4. Agent Setup

```bash
cd agent
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials:
# - BACKEND_URL (default: http://localhost:3000/api)
# - OPENAI_API_KEY
# - LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
# - DEEPGRAM_API_KEY
# - CARTESIA_API_KEY
```

## 🏃 Running the Application

### Start MongoDB

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (update MONGODB_URI in backend/.env)
```

### Start Backend

```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

### Start Frontend

```bash
cd frontend
npm run dev
# UI runs on http://localhost:5173
```

### Start Voice Agent

```bash
cd agent
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py start
# Agent connects to LiveKit and waits for calls
```

## 📚 API Documentation

### Help Requests

- `GET /api/help-requests` - Get all requests
- `POST /api/help-requests` - Create request
- `PATCH /api/help-requests/:id/resolve` - Resolve request
- `DELETE /api/help-requests/:id` - Delete request

### Knowledge Base

- `GET /api/knowledge-base` - Get all entries
- `GET /api/knowledge-base/search?q=query` - Semantic search
- `POST /api/knowledge-base` - Add entry
- `PATCH /api/knowledge-base/:id` - Update entry
- `DELETE /api/knowledge-base/:id` - Delete entry

### Agent Integration

- `POST /api/agent/check-knowledge` - Check if answer exists
- `POST /api/agent/escalate` - Escalate to supervisor
- `GET /api/agent/kb-sync` - Sync knowledge base

### Dashboard

- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/analytics` - Get analytics

## 🔌 WebSocket Events

### Client → Server

- `subscribe` - Subscribe to room updates (default: "supervisor")
- `unsubscribe` - Unsubscribe from room
- `ping` - Heartbeat check

### Server → Client

- `connection_info` - Initial connection metadata
- `subscribed` - Confirmation of subscription
- `new_help_request` - New escalation from voice agent
- `request_resolved` - Request answered by supervisor
- `kb_updated` - Knowledge base entry added/updated/deleted
- `request_timeout_warning` - Request about to timeout (5 min warning)
- `pong` - Heartbeat response

## 📡 Webhook Notifications

All notifications are sent to `WEBHOOK_URL` (if configured) as POST requests:

### Event Types

**`supervisor_notification`** - New help request escalated

```json
{
  "event": "supervisor_notification",
  "timestamp": "2025-10-25T00:00:00.000Z",
  "data": {
    "requestId": "...",
    "question": "...",
    "customerPhone": "+1234567890",
    "createdAt": "..."
  }
}
```

**`customer_notification`** - Answer sent to customer

```json
{
  "event": "customer_notification",
  "timestamp": "2025-10-25T00:00:00.000Z",
  "data": {
    "phone": "+1234567890",
    "message": "..."
  }
}
```

**`agent_notification`** - Knowledge base updated

```json
{
  "event": "agent_notification",
  "timestamp": "2025-10-25T00:00:00.000Z",
  "data": {
    "kbEntryId": "...",
    "question": "...",
    "answer": "...",
    "category": "services"
  }
}
```

**`timeout_warning`** - Request timing out

```json
{
  "event": "timeout_warning",
  "timestamp": "2025-10-25T00:00:00.000Z",
  "data": {
    "requestId": "...",
    "question": "...",
    "minutesRemaining": 5,
    "timeoutAt": "..."
  }
}
```

## 🗂️ Project Structure

```
HeySalonDesk/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── HelpRequest.js       # Help request schema
│   │   │   └── KnowledgeBase.js     # Knowledge base schema
│   │   ├── services/
│   │   │   ├── HelpRequestService.js    # Request management
│   │   │   ├── KnowledgeBaseService.js  # KB + Mem0 integration
│   │   │   ├── Mem0Service.js           # Mem0 API client
│   │   │   ├── NotificationService.js   # Webhooks + logging
│   │   │   ├── WebSocketService.js      # Socket.io handlers
│   │   │   └── DashboardService.js      # Analytics
│   │   ├── routes/
│   │   │   ├── agent.js             # Agent API endpoints
│   │   │   ├── helpRequests.js      # CRUD for requests
│   │   │   ├── knowledgeBase.js     # CRUD for KB
│   │   │   └── dashboard.js         # Stats endpoints
│   │   ├── jobs/
│   │   │   └── timeoutChecker.js    # Cron job (every 5 min)
│   │   └── server.js                # Express + Socket.io server
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── RequestCard.jsx      # Help request card
│   │   │   ├── AnswerModal.jsx      # Answer form modal
│   │   │   └── KnowledgeTable.jsx   # KB table
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Stats dashboard
│   │   │   ├── PendingRequests.jsx  # Pending queue
│   │   │   ├── ResolvedRequests.jsx # Resolved history
│   │   │   ├── UnresolvedRequests.jsx # Unresolved/timed-out requests
│   │   │   └── KnowledgeBase.jsx    # KB management
│   │   ├── hooks/
│   │   │   └── useWebSocket.js      # Socket.io hook
│   │   ├── services/
│   │   │   └── api.js               # Axios API client
│   │   ├── App.jsx                  # Router
│   │   └── main.jsx                 # Entry point
│   ├── .env.example
│   └── package.json
├── agent/
│   ├── main.py                      # LiveKit voice agent
│   ├── requirements.txt             # Python dependencies
│   └── .env.example
├── DESIGN_DECISIONS.md              # Architecture docs
├── API_REFERENCE.md                 # API documentation
├── SETUP_GUIDE.md                   # Setup instructions
└── README.md
```

## 🎯 Usage Flow

1. **Customer calls** → Voice agent (StyleGuide) greets and listens
2. **Agent searches KB** → Uses `query_knowledge_base` tool with Mem0 semantic search
3. **Answer found** → Agent responds naturally from knowledge base
4. **Unknown question** → Agent uses `notify_human_operator` to escalate
5. **Supervisor notified** → Real-time WebSocket + Webhook notification
6. **Supervisor answers** → Via dashboard, answer saved to MongoDB + Mem0
7. **Customer notified** → Webhook sent (can integrate with SMS/email service)
8. **Knowledge learned** → Future calls on same topic are auto-answered

## 🤖 Voice Agent Details

### Agent Personality

- **Name**: StyleGuide
- **Role**: Friendly and professional voice assistant for StyleGuide Salon
- **Voice**: Cartesia TTS (voice ID: `a167e0f3-df7e-4d52-a9c3-f949145efdab`)
- **LLM**: GPT-4.1 (OpenAI)
- **STT**: Deepgram Nova-3 (multilingual)
- **VAD**: Silero Voice Activity Detection

### Agent Capabilities

- Answers questions about salon hours, services, pricing, location
- Books appointments (checks availability via KB)
- Escalates unknown questions to human operators
- Speaks naturally without symbols or formatting
- Handles multilingual conversations

### Agent Tools

1. **`query_knowledge_base(query: str)`** - Semantic search in Mem0
2. **`notify_human_operator(question: str, customer_phone: str)`** - Escalate to supervisor

## 🧪 Testing

### Test Backend

```bash
cd backend
npm test
```

### Test API Endpoints

```bash
# Create a help request
curl -X POST http://localhost:3000/api/help-requests \
  -H "Content-Type: application/json" \
  -d '{"question":"Do you offer kids haircuts?","customerPhone":"+1234567890"}'

# Search knowledge base
curl "http://localhost:3000/api/knowledge-base/search?q=haircut"
```

### Test Frontend

Open http://localhost:5173 and navigate through:

- Dashboard (view statistics)
- Pending Requests (answer questions)
- Resolved Requests (view answered questions)
- Unresolved Requests (view timed-out/unresolved questions)
- Knowledge Base (view learned answers)

## 🔧 Configuration

### Backend Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/salon-hitl
MEM0_API_KEY=your_mem0_api_key
NODE_ENV=development
SOCKET_CORS_ORIGIN=http://localhost:5173
WEBHOOK_URL=https://your-webhook-endpoint.com/notifications
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

### Agent Environment Variables

```env
BACKEND_URL=http://localhost:3000/api
OPENAI_API_KEY=your_openai_api_key
LIVEKIT_URL=wss://your-livekit-url
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
DEEPGRAM_API_KEY=your_deepgram_api_key
CARTESIA_API_KEY=your_cartesia_api_key
```

## 📊 Database Schema

### HelpRequest

```javascript
{
  question: String,
  customerPhone: String,
  customerContext: String,
  status: 'pending' | 'resolved' | 'unresolved',
  answer: String,
  supervisorNotes: String,
  timeoutAt: Date,
  resolvedAt: Date,
  memoryId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### KnowledgeBase

```javascript
{
  question: String,
  answer: String,
  category: 'hours' | 'services' | 'pricing' | 'location' | 'booking' | 'other',
  tags: [String],
  source: 'initial' | 'learned',
  sourceRequestId: ObjectId,
  usageCount: Number,
  memoryId: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚦 Background Jobs

### Timeout Checker (`timeoutChecker.js`)

**Schedule**: Every 5 minutes (cron: `*/5 * * * *`)

**Tasks**:

1. **Check Timeouts**: Mark pending requests as "unresolved" after 30 minutes
2. **Send Warnings**: Notify supervisors 5 minutes before timeout
3. **WebSocket Emit**: Send `request_timeout_warning` event
4. **Webhook Notification**: POST to `WEBHOOK_URL` with timeout details

**Implementation**: Uses `node-cron` for scheduling

## 🎨 UI Features

### Dashboard Page

- Real-time statistics (total requests, resolved, pending, resolution rate)
- Average response time metrics
- Top questions chart
- Knowledge base growth tracking
- WebSocket connection status indicator

### Pending Requests Page

- List of unanswered escalations
- Urgency indicators (time since creation)
- Quick answer modal with category selection
- Auto-refresh on new requests (WebSocket)
- Filter by status and date

### Knowledge Base Page

- Searchable table with all KB entries
- Filter by category (hours, services, pricing, location, booking, other)
- Usage count tracking
- Add/Edit/Delete functionality
- Syncs with Mem0 automatically

### Unresolved Requests Page

- List of all unresolved/timed-out requests
- Shows timeout reason (auto-timeout or manual)
- Time elapsed tracking
- Customer contact information
- Detailed view modal with full context

### Tech Stack

- **Framework**: React 18 + Vite
- **UI Library**: Ant Design 5
- **Icons**: @ant-design/icons
- **Routing**: React Router DOM 6
- **HTTP Client**: Axios
- **WebSocket**: Socket.io-client
- **Date Handling**: Day.js

## 🔒 Security Notes

- Never commit `.env` files
- Use environment variables for all secrets
- Implement authentication in production
- Validate all user inputs
- Use HTTPS in production

## 📈 Scaling Considerations

### Database

- Use **MongoDB Atlas** for production (auto-scaling, backups)
- Index frequently queried fields (`status`, `createdAt`, `memoryId`)
- Consider sharding for high-volume deployments

### Backend

- Deploy on **AWS/GCP/Azure** with auto-scaling
- Use **Redis** for WebSocket session management
- Implement **rate limiting** on API endpoints
- Add **caching layer** (Redis) for KB queries
- Use **PM2** or **Docker** for process management

### Frontend

- Deploy to **Vercel/Netlify** for automatic CDN
- Enable **gzip compression**
- Implement **lazy loading** for routes

### Voice Agent

- Use **LiveKit Cloud** for production
- Deploy multiple agent instances for load balancing
- Monitor API usage (OpenAI, Deepgram, Cartesia)

### Monitoring

- Add **logging** (Winston, Pino)
- Use **APM tools** (New Relic, Datadog)
- Set up **error tracking** (Sentry)
- Monitor **webhook delivery** success rates

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongosh

# Verify connection
mongoose.connection.readyState  # Should be 1 (connected)

# Check .env MONGODB_URI format
# mongodb://localhost:27017/salon-hitl
# or mongodb+srv://user:pass@cluster.mongodb.net/salon-hitl
```

### Mem0 API Errors

- Verify `MEM0_API_KEY` is correct in backend `.env`
- Check Mem0 service status at [status.mem0.ai](https://status.mem0.ai)
- Ensure sufficient API credits in Mem0 dashboard
- Check network connectivity to Mem0 API
- Review error logs: `console.error("Mem0 search error:", error)`

### WebSocket Not Connecting

- Check `SOCKET_CORS_ORIGIN` in backend `.env` matches frontend URL
- Verify `VITE_WS_URL` in frontend `.env` (should be `http://localhost:3000`)
- Check browser console for CORS errors
- Ensure backend is running before starting frontend
- Check firewall/proxy settings

### Voice Agent Issues

**Agent not starting:**

- Verify all API keys in `agent/.env`
- Check Python version: `python --version` (should be 3.9+)
- Reinstall dependencies: `pip install -r requirements.txt`

**Agent can't connect to backend:**

- Verify `BACKEND_URL` in `agent/.env`
- Ensure backend is running on correct port
- Check network connectivity

**LiveKit connection errors:**

- Verify LiveKit credentials (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`)
- Check LiveKit dashboard for room status
- Ensure LiveKit account is active

### Webhook Not Sending

- Check `WEBHOOK_URL` is set in backend `.env`
- Verify webhook endpoint is accessible
- Check backend logs for webhook errors
- Test webhook URL with curl:
  ```bash
  curl -X POST https://your-webhook-url.com \
    -H "Content-Type: application/json" \
    -d '{"event":"test","data":{}}'
  ```

## 📝 License

MIT

## 🎯 Future Enhancements

- [ ] SMS integration with Twilio for customer notifications
- [ ] Multi-language support for voice agent
- [ ] Analytics dashboard with charts and graphs
- [ ] Agent performance metrics and A/B testing
- [ ] Calendar integration for appointment booking
- [ ] Customer feedback collection
- [ ] Voice agent training interface
- [ ] Multi-tenant support for multiple salons

## 👥 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Support

For issues or questions, please open a GitHub issue.

---

## 🔑 Key Technologies

### Backend

- **Express 5** - Web framework
- **Mongoose 8** - MongoDB ODM
- **Socket.io 4** - WebSocket server
- **Mem0 AI 2.1.38** - Semantic memory
- **Axios** - HTTP client for webhooks
- **node-cron** - Job scheduling

### Frontend

- **React 18** - UI framework
- **Vite 5** - Build tool
- **Ant Design 5** - Component library
- **Socket.io-client 4** - WebSocket client
- **React Router 6** - Routing

### Voice Agent

- **LiveKit SDK** - Real-time communication
- **OpenAI GPT-4.1** - Language model
- **Deepgram Nova-3** - Speech-to-text
- **Cartesia** - Text-to-speech
- **Silero VAD** - Voice activity detection

---

Built with ❤️ for StyleGuide Salon customer service automation
