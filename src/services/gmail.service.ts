import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Email, UserToken, EmailThread, EmailMessage } from '../types';
import { SupabaseService } from './supabase.service';

export class GmailService {
  private oauth2Client: OAuth2Client;
  private gmail: any;
  private supabaseService: SupabaseService;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    this.supabaseService = new SupabaseService();
  }

  async getAuthUrl(): Promise<string> {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async exchangeCodeForTokens(code: string): Promise<UserToken> {
    const { tokens } = await this.oauth2Client.getToken(code);
    
    // Get user email from Gmail API
    const userInfo = await this.gmail.users.getProfile({ userId: 'me' });
    const email = userInfo.data.emailAddress;
    const userId = email; // Using email as userId for simplicity

    // Store tokens in Supabase
    const userToken: Omit<UserToken, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      email,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      scope: tokens.scope!,
      tokenType: tokens.token_type!,
      expiryDate: tokens.expiry_date!
    };

    return this.supabaseService.saveUserToken(userToken);
  }

  async setCredentialsFromStorage(userId: string): Promise<void> {
    const userToken = await this.supabaseService.getUserToken(userId);
    if (!userToken) {
      throw new Error('No stored credentials found');
    }

    // Check if token needs refresh
    if (userToken.expiryDate <= Date.now()) {
      this.oauth2Client.setCredentials({
        refresh_token: userToken.refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update stored tokens
      await this.supabaseService.saveUserToken({
        ...userToken,
        accessToken: credentials.access_token!,
        expiryDate: credentials.expiry_date!
      });

      this.oauth2Client.setCredentials(credentials);
    } else {
      this.oauth2Client.setCredentials({
        access_token: userToken.accessToken,
        refresh_token: userToken.refreshToken,
        scope: userToken.scope,
        token_type: userToken.tokenType,
        expiry_date: userToken.expiryDate
      });
    }
  }

  async listEmails(userId: string, maxResults: number = 10): Promise<Email[]> {
    try {
      await this.setCredentialsFromStorage(userId);
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
      });

      const messages = response.data.messages || [];
      const emails: Email[] = [];

      for (const message of messages) {
        const email = await this.getEmail(message.id);
        if (email) {
          emails.push(email);
        }
      }

      return emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  private async getEmail(messageId: string): Promise<Email | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data;
      const headers = message.payload.headers;
      
      const getHeader = (name: string) => {
        const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : '';
      };

      return {
        id: message.id,
        threadId: message.threadId,
        from: getHeader('From'),
        to: getHeader('To'),
        subject: getHeader('Subject'),
        snippet: message.snippet,
        body: this.decodeBody(message.payload),
        date: getHeader('Date'),
      };
    } catch (error) {
      console.error('Error fetching email:', error);
      return null;
    }
  }

  private decodeBody(payload: any): string {
    if (payload.body.data) {
      return Buffer.from(payload.body.data, 'base64').toString();
    }

    if (payload.parts) {
      return payload.parts
        .map((part: any) => this.decodeBody(part))
        .join('\n');
    }

    return '';
  }

  async getRecentThreads(userId: string, maxResults: number = 10): Promise<EmailThread[]> {
    try {
      await this.setCredentialsFromStorage(userId);

      // Get list of threads
      const response = await this.gmail.users.threads.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox' // Only get inbox threads
      });

      const threads = response.data.threads || [];
      const emailThreads: EmailThread[] = [];

      // Fetch full details for each thread
      for (const thread of threads) {
        const threadDetails = await this.gmail.users.threads.get({
          userId: 'me',
          id: thread.id
        });

        const messages = threadDetails.data.messages || [];
        const emailMessages: EmailMessage[] = [];

        // Process each message in the thread
        for (const message of messages) {
          const emailMessage = await this.processMessage(message);
          if (emailMessage) {
            emailMessages.push(emailMessage);
          }
        }

        if (emailMessages.length > 0) {
          // Sort messages by date
          emailMessages.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          emailThreads.push({
            id: thread.id,
            subject: emailMessages[0].subject,
            messages: emailMessages,
            lastMessageDate: emailMessages[0].date
          });
        }
      }

      // Sort threads by last message date
      return emailThreads.sort((a, b) => 
        new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
      );
    } catch (error) {
      console.error('Error fetching threads:', error);
      throw error;
    }
  }

  private async processMessage(message: any): Promise<EmailMessage | null> {
    try {
      const headers = message.payload.headers;
      const getHeader = (name: string) => {
        const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : '';
      };

      // Get the message body
      const body = this.decodeBody(message.payload);

      return {
        id: message.id,
        from: getHeader('From'),
        to: getHeader('To'),
        subject: getHeader('Subject'),
        body,
        date: getHeader('Date'),
        isReply: message.payload.headers.some((h: any) => 
          h.name.toLowerCase() === 'in-reply-to' || h.name.toLowerCase() === 'references'
        )
      };
    } catch (error) {
      console.error('Error processing message:', error);
      return null;
    }
  }

  async sendReply(userId: string, threadId: string, message: string): Promise<void> {
    try {
      await this.setCredentialsFromStorage(userId);

      // Get the thread to find the last message's recipient
      const thread = await this.gmail.users.threads.get({
        userId: 'me',
        id: threadId
      });

      const messages = thread.data.messages || [];
      if (messages.length === 0) {
        throw new Error('Thread not found');
      }

      // Get the last message to determine the recipient
      const lastMessage = messages[messages.length - 1];
      const headers = lastMessage.payload.headers;
      const getHeader = (name: string) => {
        const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : '';
      };

      const to = getHeader('From'); // Reply to the sender of the last message
      const subject = getHeader('Subject');
      const inReplyTo = getHeader('Message-ID');
      const references = getHeader('References') || inReplyTo;

      // Create the email content
      const emailLines = [
        `To: ${to}`,
        `Subject: Re: ${subject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        `In-Reply-To: ${inReplyTo}`,
        `References: ${references}`,
        '',
        message
      ];

      const email = emailLines.join('\r\n').trim();
      const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      // Send the email
      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
          threadId: threadId
        }
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      throw error;
    }
  }
} 