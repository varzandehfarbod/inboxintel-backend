import OpenAI from 'openai';
import { EmailSummary, EmailThread, ThreadSummary } from '../types';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async summarizeThread(thread: EmailThread, userId: string): Promise<ThreadSummary> {
    try {
      // Format the thread content for the prompt
      const threadContent = thread.messages.map(msg => `
From: ${msg.from}
To: ${msg.to}
Date: ${msg.date}
Subject: ${msg.subject}
${msg.isReply ? '(Reply)' : '(Original Message)'}
${msg.body}
---`).join('\n');

      const prompt = `Please analyze this email thread and provide:
1. A concise two-sentence summary of the conversation
2. Urgency level (Low, Medium, or High)
3. Suggested action (Reply, Follow Up, Read Later, Archive, or Forward)

Consider:
- The tone and content of the messages
- Time sensitivity
- Whether it requires immediate attention
- If it's a one-time conversation or ongoing discussion

Email thread:
${threadContent}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that analyzes email threads and provides concise summaries, urgency levels, and suggested actions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      const result = response.choices[0].message.content;
      
      // Parse the response
      const lines = result?.split('\n') || [];
      const summary = lines
        .filter(line => !line.toLowerCase().includes('urgency:') && !line.toLowerCase().includes('action:'))
        .join(' ')
        .trim();
      
      const urgency = lines
        .find(line => line.toLowerCase().includes('urgency:'))
        ?.split(':')[1]
        ?.trim()
        ?.toLowerCase() as 'low' | 'medium' | 'high' || 'low';

      const suggestedAction = lines
        .find(line => line.toLowerCase().includes('action:'))
        ?.split(':')[1]
        ?.trim()
        ?.toLowerCase() as 'reply' | 'follow up' | 'read later' | 'archive' | 'forward' || 'read later';

      return {
        id: crypto.randomUUID(),
        threadId: thread.id,
        userId,
        summary,
        urgency: urgency.charAt(0).toUpperCase() + urgency.slice(1) as 'Low' | 'Medium' | 'High',
        suggestedAction: suggestedAction.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ') as 'Reply' | 'Follow Up' | 'Read Later' | 'Archive' | 'Forward',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error summarizing thread:', error);
      throw error;
    }
  }

  async summarizeEmail(emailBody: string): Promise<EmailSummary> {
    try {
      const prompt = `Please analyze the following email and provide:
1. A concise summary
2. Key points
3. Overall sentiment (positive, negative, or neutral)

Email content:
${emailBody}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that analyzes emails and provides concise summaries, key points, and sentiment analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      const result = response.choices[0].message.content;
      
      // Parse the response to extract summary, key points, and sentiment
      const lines = result?.split('\n') || [];
      const summary = lines.find(line => line.toLowerCase().includes('summary:'))?.split(':')[1]?.trim() || '';
      const keyPoints = lines
        .filter(line => line.toLowerCase().includes('key point'))
        .map(line => line.split(':')[1]?.trim())
        .filter(Boolean);
      const sentiment = lines
        .find(line => line.toLowerCase().includes('sentiment:'))
        ?.split(':')[1]
        ?.trim()
        ?.toLowerCase() as 'positive' | 'negative' | 'neutral' || 'neutral';

      return {
        id: crypto.randomUUID(),
        emailId: '', // This will be set by the controller
        summary,
        keyPoints,
        sentiment,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error summarizing email:', error);
      throw error;
    }
  }
} 