import { Resend } from 'resend';
import { ThreadSummary } from '../types';

export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendDailyDigest(userEmail: string, summaries: ThreadSummary[]): Promise<void> {
    try {
      // Sort summaries by urgency (High > Medium > Low)
      const urgencyOrder = { High: 0, Medium: 1, Low: 2 };
      const sortedSummaries = summaries
        .sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
        .slice(0, 10);

      // Group summaries by urgency
      const groupedSummaries = sortedSummaries.reduce((acc, summary) => {
        if (!acc[summary.urgency]) {
          acc[summary.urgency] = [];
        }
        acc[summary.urgency].push(summary);
        return acc;
      }, {} as Record<string, ThreadSummary[]>);

      // Create HTML content
      const htmlContent = `
        <h1>Your Daily Email Digest</h1>
        <p>Here are your most urgent emails that need attention:</p>
        
        ${Object.entries(groupedSummaries).map(([urgency, summaries]) => `
          <h2>${urgency} Priority</h2>
          ${summaries.map(summary => `
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
              <h3 style="margin: 0 0 10px 0;">${summary.subject}</h3>
              <p style="margin: 0 0 10px 0;">${summary.summary}</p>
              <div style="color: #666;">
                <strong>Suggested Action:</strong> ${summary.suggestedAction}
              </div>
            </div>
          `).join('')}
        `).join('')}

        <p style="margin-top: 20px; color: #666;">
          This is an automated digest from your AI Email Assistant.
        </p>
      `;

      await this.resend.emails.send({
        from: 'AI Email Assistant <digest@yourdomain.com>',
        to: userEmail,
        subject: 'Your Daily Email Digest',
        html: htmlContent
      });
    } catch (error) {
      console.error('Error sending daily digest:', error);
      throw error;
    }
  }
} 