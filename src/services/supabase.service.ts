import { createClient } from '@supabase/supabase-js';
import { EmailSummary, UserToken, ThreadSummary, EmailReply } from '../types';

export class SupabaseService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  async saveEmailSummary(summary: EmailSummary): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('email_summaries')
        .insert([summary]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving email summary:', error);
      throw error;
    }
  }

  async getEmailSummaries(): Promise<EmailSummary[]> {
    try {
      const { data, error } = await this.supabase
        .from('email_summaries')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching email summaries:', error);
      throw error;
    }
  }

  async getEmailSummaryById(id: string): Promise<EmailSummary | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_summaries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching email summary:', error);
      throw error;
    }
  }

  async saveUserToken(token: Omit<UserToken, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserToken> {
    try {
      const { data, error } = await this.supabase
        .from('user_tokens')
        .upsert([{
          ...token,
          updatedAt: new Date().toISOString()
        }], {
          onConflict: 'userId'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving user token:', error);
      throw error;
    }
  }

  async getUserToken(userId: string): Promise<UserToken | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_tokens')
        .select('*')
        .eq('userId', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user token:', error);
      throw error;
    }
  }

  async deleteUserToken(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_tokens')
        .delete()
        .eq('userId', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user token:', error);
      throw error;
    }
  }

  async saveThreadSummary(summary: Omit<ThreadSummary, 'id' | 'createdAt' | 'updatedAt'>): Promise<ThreadSummary> {
    try {
      const { data, error } = await this.supabase
        .from('thread_summaries')
        .upsert([{
          ...summary,
          updatedAt: new Date().toISOString()
        }], {
          onConflict: 'threadId,userId'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving thread summary:', error);
      throw error;
    }
  }

  async getThreadSummaries(userId: string): Promise<ThreadSummary[]> {
    try {
      const { data, error } = await this.supabase
        .from('thread_summaries')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching thread summaries:', error);
      throw error;
    }
  }

  async getThreadSummaryById(id: string): Promise<ThreadSummary | null> {
    try {
      const { data, error } = await this.supabase
        .from('thread_summaries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching thread summary:', error);
      throw error;
    }
  }

  async saveEmailReply(reply: Omit<EmailReply, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailReply> {
    try {
      const { data, error } = await this.supabase
        .from('email_replies')
        .insert([{
          ...reply,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving email reply:', error);
      throw error;
    }
  }

  async getThreadReplies(threadId: string): Promise<EmailReply[]> {
    try {
      const { data, error } = await this.supabase
        .from('email_replies')
        .select('*')
        .eq('threadId', threadId)
        .order('sentAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching thread replies:', error);
      throw error;
    }
  }

  async getUserReplies(userId: string): Promise<EmailReply[]> {
    try {
      const { data, error } = await this.supabase
        .from('email_replies')
        .select('*')
        .eq('userId', userId)
        .order('sentAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user replies:', error);
      throw error;
    }
  }

  async getUsersWithTokens(): Promise<UserToken[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_tokens')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users with tokens:', error);
      throw error;
    }
  }
} 