interface CronState {
	id: string;
	lastRun?: Date | undefined | null;
}

export interface StateStore {
	getAll: () => Promise<CronState[]> | CronState[];
	setLastRun: (id: string, date: Date) => Promise<unknown> | unknown;
}
