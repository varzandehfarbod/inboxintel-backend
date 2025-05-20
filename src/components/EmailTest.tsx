import React, { useEffect, useState } from 'react';

// Types
interface EmailSummary {
  id: string;
  emailId: string;
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  createdAt: string;
}

interface ThreadSummary {
  id: string;
  threadId: string;
  userId: string;
  subject: string;
  summary: string;
  urgency: 'Low' | 'Medium' | 'High';
  suggestedAction: string;
  createdAt: string;
  updatedAt: string;
}

interface Summaries {
  emailSummaries: EmailSummary[];
  threadSummaries: ThreadSummary[];
}

interface Reply {
  id: string;
  threadId: string;
  userId: string;
  message: string;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
}

interface ReplyResponse {
  message: string;
  reply: Reply;
}

const EmailTest: React.FC = () => {
  const [summaries, setSummaries] = useState<Summaries | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyResponse, setReplyResponse] = useState<ReplyResponse | null>(null);

  // Fetch summaries
  const fetchSummaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/email/user@example.com/summary');
      const data = await response.json();
      setSummaries(data);
    } catch (err) {
      setError('Failed to fetch summaries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Send reply
  const sendReply = async (threadId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/email/user@example.com/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          message: replyMessage,
        }),
      });
      const data = await response.json();
      setReplyResponse(data);
      setReplyMessage('');
    } catch (err) {
      setError('Failed to send reply');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  if (loading && !summaries) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!summaries) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Email Test Component</h1>
      
      {/* Thread Summaries */}
      <h2>Thread Summaries</h2>
      <div style={{ display: 'grid', gap: '20px' }}>
        {summaries.threadSummaries.map(thread => (
          <div 
            key={thread.id}
            style={{
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}
          >
            <h3 style={{ margin: '0 0 10px 0' }}>{thread.subject}</h3>
            <p style={{ margin: '0 0 10px 0' }}>{thread.summary}</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 
                  thread.urgency === 'High' ? '#ffebee' :
                  thread.urgency === 'Medium' ? '#fff3e0' :
                  '#e8f5e9',
                color: 
                  thread.urgency === 'High' ? '#c62828' :
                  thread.urgency === 'Medium' ? '#ef6c00' :
                  '#2e7d32'
              }}>
                {thread.urgency} Priority
              </span>
              <span style={{ color: '#666' }}>
                Action: {thread.suggestedAction}
              </span>
            </div>
            
            {/* Reply Form */}
            <div style={{ marginTop: '10px' }}>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
                rows={3}
              />
              <button
                onClick={() => sendReply(thread.threadId)}
                disabled={!replyMessage.trim() || loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: !replyMessage.trim() || loading ? 0.7 : 1
                }}
              >
                {loading ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Response */}
      {replyResponse && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e8f5e9',
          borderRadius: '8px',
          border: '1px solid #81c784'
        }}>
          <h3>Last Reply Sent</h3>
          <p><strong>Message:</strong> {replyResponse.reply.message}</p>
          <p><strong>Sent at:</strong> {new Date(replyResponse.reply.sentAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default EmailTest; 