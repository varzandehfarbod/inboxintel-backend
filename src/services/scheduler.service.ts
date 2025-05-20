import { SupabaseService } from './supabase.service';
import { EmailService } from './email.service';
import { UserToken } from '../types';

export class SchedulerService {
  private supabaseService: SupabaseService;
  private emailService: EmailService;

  constructor() {
    this.supabaseService = new SupabaseService();
    this.emailService = new EmailService();
  }

  async sendDailyDigests(): Promise<void> {
    try {
      // Get all users with valid tokens
      const users = await this.supabaseService.getUsersWithTokens();

      // Process each user
      for (const user of users) {
        try {
          // Get user's thread summaries
          const summaries = await this.supabaseService.getThreadSummaries(user.userId);

          // Filter out already replied threads
          const unrepliedSummaries = summaries.filter(
            summary => summary.suggestedAction !== 'Replied'
          );

          // Send digest if there are unreplied summaries
          if (unrepliedSummaries.length > 0) {
            await this.emailService.sendDailyDigest(user.email, unrepliedSummaries);
          }
        } catch (error) {
          console.error(`Error processing user ${user.userId}:`, error);
          // Continue with next user even if one fails
          continue;
        }
      }
    } catch (error) {
      console.error('Error sending daily digests:', error);
      throw error;
    }
  }
} 