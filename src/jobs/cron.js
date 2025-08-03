import cron from 'node-cron';
import { processScheduledNewsletters } from './processScheduledNewsletters';

// Run every minute
cron.schedule('* * * * *', async () => {
  console.log('Running scheduled newsletter processing...');
  try {
    await processScheduledNewsletters();
  } catch (error) {
    console.error('Error in newsletter cron job:', error);
  }
});

// Export the cron job for use in the main application
export default cron; 