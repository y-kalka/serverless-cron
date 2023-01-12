export interface CronJob {
	id: string;
	cronTime: string;
	handler: () => Promise<void> | void;
}
