import { SchedulerService } from '../services/scheduler.service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    const scheduler = new SchedulerService();
    await scheduler.sendDailyDigests();
    console.log('Daily digests sent successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error sending daily digests:', error);
    process.exit(1);
  }
}

main(); 