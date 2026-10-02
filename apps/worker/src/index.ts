import dotenv from 'dotenv';
import { APP_CONFIG } from '@mivo/config';

dotenv.config();

console.log(`⚙️ [Mivo Collab Worker] Initializing background task processor...`);

interface Job {
  id: string;
  type: 'meeting_cleanup' | 'meeting_reminder' | 'ai_transcription' | 'ai_summary';
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

class BackgroundWorker {
  private queue: Job[] = [];
  private isProcessing = false;

  constructor() {
    this.startScheduler();
  }

  public enqueue(type: Job['type'], payload: any) {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.queue.push(job);
    console.log(`📥 [Worker] Enqueued job ${job.id} (${job.type})`);
    this.processNext();
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const job = this.queue.shift()!;
    job.status = 'processing';

    console.log(`⚡ [Worker] Processing job ${job.id} (${job.type})...`);

    try {
      await this.executeJob(job);
      job.status = 'completed';
      console.log(`✅ [Worker] Job ${job.id} completed successfully`);
    } catch (err) {
      job.status = 'failed';
      console.error(`❌ [Worker] Job ${job.id} failed:`, err);
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }

  private async executeJob(job: Job): Promise<void> {
    switch (job.type) {
      case 'meeting_cleanup':
        // Simulates finding abandoned meetings older than 24h and marking as ended
        await new Promise((res) => setTimeout(res, 500));
        break;

      case 'meeting_reminder':
        // Dispatches email / webhook notifications for upcoming meetings
        await new Promise((res) => setTimeout(res, 800));
        break;

      case 'ai_transcription':
        // Converts meeting audio track segments into timestamped transcript
        await new Promise((res) => setTimeout(res, 1200));
        break;

      case 'ai_summary':
        // Generates key summary bullets and action items from transcript
        await new Promise((res) => setTimeout(res, 1500));
        break;
    }
  }

  private startScheduler() {
    // Routine cron task every 60s
    setInterval(() => {
      this.enqueue('meeting_cleanup', { checkTimestamp: new Date().toISOString() });
    }, 60000);

    console.log(`🕒 [Worker] Scheduler active. Running health checks every 60s.`);
  }
}

const worker = new BackgroundWorker();

// Test initial jobs
worker.enqueue('ai_transcription', { meetingId: 'mtg_public_demo', durationSec: 120 });
worker.enqueue('ai_summary', { meetingId: 'mtg_public_demo' });

process.on('SIGTERM', () => {
  console.log('🛑 [Worker] Shutting down gracefully...');
  process.exit(0);
});
