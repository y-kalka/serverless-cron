type CronValue = number | "*" | `*/${number}`;
export type CronString =
	`${CronValue} ${CronValue} ${CronValue} ${CronValue} ${CronValue}`;

type CronHandler<R = void> = () => Promise<R> | R;

export interface CronJobOptions<R = void> {
	id: string;
	cronTime: CronString;
	handler: CronHandler<R>;
}

export class CronJob<R = void> {
	readonly id: string;
	readonly cron: CronString;
	readonly handler: CronHandler<R>;

	constructor(options: CronJobOptions<R>) {
		this.id = options.id;
		this.cron = options.cronTime;
		this.handler = options.handler;

		Object.freeze(this.id);
	}
}
