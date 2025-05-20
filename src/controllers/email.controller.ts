import { Request, Response } from 'express';
import { GmailService } from '../services/gmail.service';
import { OpenAIService } from '../services/openai.service';
import { SupabaseService } from '../services/supabase.service';

export class EmailController {
  private gmailService: GmailService;
  private openAIService: OpenAIService;
  private supabaseService: SupabaseService;

  constructor() {
    this.gmailService = new GmailService();
    this.openAIService = new OpenAIService();
    this.supabaseService = new SupabaseService();
  }

  async getAuthUrl(req: Request, res: Response): Promise<void> {
    try {
      const authUrl = await this.gmailService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error('Error getting auth URL:', error);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  }

  async handleAuthCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;
      if (!code) {
        res.status(400).json({ error: 'Authorization code is required' });
        return;
      }

      const userToken = await this.gmailService.exchangeCodeForTokens(code as string);
      res.json({ 
        message: 'Authentication successful',
        user: {
          email: userToken.email,
          userId: userToken.userId
        }
      });
    } catch (error) {
      console.error('Error handling auth callback:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  async processEmails(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { maxResults = 10 } = req.query;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const emails = await this.gmailService.listEmails(userId, Number(maxResults));
      
      const processedEmails = await Promise.all(
        emails.map(async (email) => {
          const summary = await this.openAIService.summarizeEmail(email.body);
          summary.emailId = email.id;
          await this.supabaseService.saveEmailSummary(summary);
          return { email, summary };
        })
      );

      res.json(processedEmails);
    } catch (error) {
      console.error('Error processing emails:', error);
      res.status(500).json({ error: 'Failed to process emails' });
    }
  }

  async getSummaries(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const summaries = await this.supabaseService.getEmailSummaries();
      res.json(summaries);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      res.status(500).json({ error: 'Failed to fetch summaries' });
    }
  }

  async getSummaryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const summary = await this.supabaseService.getEmailSummaryById(id);
      
      if (!summary) {
        res.status(404).json({ error: 'Summary not found' });
        return;
      }

      res.json(summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
      res.status(500).json({ error: 'Failed to fetch summary' });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      await this.supabaseService.deleteUserToken(userId);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Error logging out:', error);
      res.status(500).json({ error: 'Failed to logout' });
    }
  }

  async getRecentThreads(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { maxResults = 10 } = req.query;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const threads = await this.gmailService.getRecentThreads(userId, Number(maxResults));
      res.json(threads);
    } catch (error) {
      console.error('Error fetching threads:', error);
      res.status(500).json({ error: 'Failed to fetch email threads' });
    }
  }

  async summarizeThreads(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { maxResults = 10 } = req.query;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      // Get recent threads
      const threads = await this.gmailService.getRecentThreads(userId, Number(maxResults));
      
      // Summarize each thread
      const summaries = await Promise.all(
        threads.map(async (thread) => {
          const summary = await this.openAIService.summarizeThread(thread, userId);
          await this.supabaseService.saveThreadSummary(summary);
          return {
            thread,
            summary
          };
        })
      );

      res.json(summaries);
    } catch (error) {
      console.error('Error summarizing threads:', error);
      res.status(500).json({ error: 'Failed to summarize threads' });
    }
  }

  async getThreadSummaries(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const summaries = await this.supabaseService.getThreadSummaries(userId);
      res.json(summaries);
    } catch (error) {
      console.error('Error fetching thread summaries:', error);
      res.status(500).json({ error: 'Failed to fetch thread summaries' });
    }
  }

  async getAllSummaries(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      // Get both email and thread summaries
      const [emailSummaries, threadSummaries] = await Promise.all([
        this.supabaseService.getEmailSummaries(),
        this.supabaseService.getThreadSummaries(userId)
      ]);

      res.json({
        emailSummaries,
        threadSummaries
      });
    } catch (error) {
      console.error('Error fetching all summaries:', error);
      res.status(500).json({ error: 'Failed to fetch summaries' });
    }
  }

  async sendReply(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { threadId, message } = req.body;

      if (!userId || !threadId || !message) {
        res.status(400).json({ 
          error: 'User ID, thread ID, and message are required' 
        });
        return;
      }

      // Send the reply using Gmail API
      await this.gmailService.sendReply(userId, threadId, message);

      // Save the reply in Supabase
      const reply = await this.supabaseService.saveEmailReply({
        threadId,
        userId,
        message,
        sentAt: new Date().toISOString()
      });

      // Update thread summary if it exists
      const threadSummary = await this.supabaseService.getThreadSummaryById(threadId);
      if (threadSummary) {
        await this.supabaseService.saveThreadSummary({
          ...threadSummary,
          suggestedAction: 'Replied'
        });
      }

      res.json({ 
        message: 'Reply sent successfully',
        reply
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      res.status(500).json({ error: 'Failed to send reply' });
    }
  }

  async getThreadReplies(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;

      if (!threadId) {
        res.status(400).json({ error: 'Thread ID is required' });
        return;
      }

      const replies = await this.supabaseService.getThreadReplies(threadId);
      res.json(replies);
    } catch (error) {
      console.error('Error fetching thread replies:', error);
      res.status(500).json({ error: 'Failed to fetch thread replies' });
    }
  }

  async getUserReplies(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const replies = await this.supabaseService.getUserReplies(userId);
      res.json(replies);
    } catch (error) {
      console.error('Error fetching user replies:', error);
      res.status(500).json({ error: 'Failed to fetch user replies' });
    }
  }
} 