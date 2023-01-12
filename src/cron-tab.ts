import { parseExpression } from 'cron-parser';
import type { CronJob } from './cron-job';
import type { StateStore } from './state-store';

interface CronTabOptions {
	timeZone?: string;
	onError?: (jobId: string, error: unknown) => void;
	onStart?: (jobId: string) => void;
	onComplete?: (jobId: string, next: Date) => void;
	store: StateStore;
}

export class CronTab {
	#jobs: CronJob[] = [];

	constructor(jobs: CronJob[], private options: CronTabOptions) {
		const usedIds = new Set()

		for (const job of jobs) {
		  if(usedIds.has(job.id)){
			throw Error(`Multiple jobs with the same id "${job.id}" detected`);
		  }

		  usedIds.add(job.id);
		}

		this.#jobs = jobs;
	}

	async run() {
		const handler = [];
		const cronStates = await this.options.store.getAll();
		const NOW = new Date();
		const NOW_TIMESTAMP = NOW.getTime();

		for (const job of this.#jobs) {
			const lastRun = cronStates.find((state) => state.id === job.id)?.lastRun;
			const interval = parseExpression(job.cronTime, {
				currentDate: lastRun || undefined,
				tz: this.options.timeZone || undefined
			});
			let nextRun = new Date();

			// When the last time is known where the job was executed check if the job should rerun now
			if (lastRun) {
				nextRun = interval.next().toDate();
			}

			if (nextRun.getTime() <= NOW_TIMESTAMP) {
				handler.push(
					(async () => {
						try {
							this.options.onStart?.(job.id);
							await job.handler();
							await this.options.store.setLastRun(job.id, NOW);
							this.options.onComplete?.(job.id, interval.next().toDate());
							// eslint-disable-next-line no-empty
						} catch (error) {
							this.options.onError?.(job.id, error);
						}
					})()
				);
			}
		}

		await Promise.all(handler);
	}
}
