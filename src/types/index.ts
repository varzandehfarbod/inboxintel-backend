export interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  messages: EmailMessage[];
  lastMessageDate: string;
}

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  isReply: boolean;
}

export interface ThreadSummary {
  id: string;
  threadId: string;
  userId: string;
  subject: string;
  summary: string;
  urgency: 'Low' | 'Medium' | 'High';
  suggestedAction: 'Reply' | 'Follow Up' | 'Read Later' | 'Archive' | 'Forward' | 'Replied';
  createdAt: string;
  updatedAt: string;
}

export interface EmailSummary {
  id: string;
  emailId: string;
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  createdAt: string;
}

export interface GmailAuthResponse {
  tokens: {
    access_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
    expiry_date: number;
  };
}

export interface UserToken {
  id: string;
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  scope: string;
  tokenType: string;
  expiryDate: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailReply {
  id: string;
  threadId: string;
  userId: string;
  message: string;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
} 