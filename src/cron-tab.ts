import cronParser from "cron-parser";
import type { CronJob } from "./cron-job";
import type { StateStore } from "./state-store";

interface CronTabOptions {
	/**
	 * @description
	 * Sets the current date to determine which jobs have to run. Currently used for tests
	 */
	currentDate?: Date;
	onError?: (jobId: string, error: unknown) => void;
	onStart?: (jobId: string) => void;
	onComplete?: (jobId: string, next: Date) => void;
	store: StateStore;
}

interface CronResponse {
	id: string;
	next: Date;
	state: "skipped" | "failed" | "successful";
}

export class CronTab {
	#jobs: CronJob[] = [];

	constructor(jobs: CronJob[], private options: CronTabOptions) {
		const usedIds = new Set();

		for (const job of jobs) {
			if (usedIds.has(job.id)) {
				throw Error(`Multiple jobs with the same id "${job.id}" detected`);
			}

			usedIds.add(job.id);
		}

		this.#jobs = jobs;
	}

	async run(): Promise<CronResponse[]> {
		const response: CronResponse[] = [];
		const tasks = [];
		const cronStates = await this.options.store.getAll();
		const NOW = this.options.currentDate || new Date();
		const NOW_TIMESTAMP = NOW.getTime();

		for (const job of this.#jobs) {
			const lastRun = cronStates.find((state) => state.id === job.id)?.lastRun;
			const interval = cronParser.parseExpression(job.cron, {
				currentDate: lastRun || undefined,
			});
			let nextRun = new Date();

			// When the last time is known where the job was executed check if the job should rerun now
			if (lastRun) {
				nextRun = interval.next().toDate();
			}

			if (nextRun.getTime() <= NOW_TIMESTAMP) {
				tasks.push(
					(async () => {
						try {
							this.options.onStart?.(job.id);
							await job.handler();
							await this.options.store.setLastRun(job.id, NOW);

							try {
								this.options.onComplete?.(job.id, interval.next().toDate());
							} catch (onSuccessError) {
								const newError = new Error("Your onComplete handler failed", {
									cause: onSuccessError,
								});

								newError.cause = console.error();

								console.error(newError);
							}

							response.push({
								id: job.id,
								next: interval.next().toDate(),
								state: "successful",
							});
						} catch (error) {
							try {
								this.options.onError?.(job.id, error);
							} catch (onErrorError) {
								const newError = new Error("Your onError handler failed", {
									cause: onErrorError,
								});

								newError.cause = console.error();

								console.error(newError);
							}

							response.push({
								id: job.id,
								next: interval.next().toDate(),
								state: "failed",
							});
						}
					})()
				);
			} else {
				response.push({
					id: job.id,
					next: nextRun,
					state: "skipped",
				});
			}
		}

		await Promise.all(tasks);

		return response;
	}
}
