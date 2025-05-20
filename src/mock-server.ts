import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Dummy data
const mockSummaries = {
  emailSummaries: [
    {
      id: "1",
      emailId: "1789a",
      summary: "Project deadline moved up to next week.",
      keyPoints: ["Deadline changed", "Immediate action required"],
      sentiment: "negative",
      createdAt: "2024-06-01T09:00:00Z"
    },
    {
      id: "2",
      emailId: "1789b",
      summary: "Team meeting scheduled for tomorrow.",
      keyPoints: ["Meeting at 2 PM", "Agenda attached"],
      sentiment: "neutral",
      createdAt: "2024-06-01T10:00:00Z"
    }
  ],
  threadSummaries: [
    {
      id: "3",
      threadId: "thread-123",
      userId: "user@example.com",
      subject: "Re: Project Deadline",
      summary: "The team discussed the new project deadline and next steps.",
      urgency: "High",
      suggestedAction: "Reply",
      createdAt: "2024-06-01T09:00:00Z",
      updatedAt: "2024-06-01T09:00:00Z"
    },
    {
      id: "4",
      threadId: "thread-456",
      userId: "user@example.com",
      subject: "Lunch Plans",
      summary: "Colleagues are planning lunch for Friday.",
      urgency: "Low",
      suggestedAction: "Read Later",
      createdAt: "2024-06-01T08:00:00Z",
      updatedAt: "2024-06-01T08:00:00Z"
    }
  ]
};

// Mock replies storage
const mockReplies: any[] = [];

// Routes
app.get('/api/email/:userId/summary', (req, res) => {
  res.json(mockSummaries);
});

app.post('/api/email/:userId/reply', (req, res) => {
  const { threadId, message } = req.body;
  const userId = req.params.userId;

  const reply = {
    id: `reply-${Date.now()}`,
    threadId,
    userId,
    message,
    sentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockReplies.push(reply);

  res.json({
    message: "Reply sent successfully",
    reply
  });
});

const PORT = 3001; // Using 3001 to avoid conflict with your main server
app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
}); 