import { expect, test } from "vitest";
import { CronJob } from "../src/cron-job";
import { CronTab } from "../src/cron-tab";

test("Skip cronjobs", async () => {
	const crontab = new CronTab(
		[new CronJob({ id: "1", cronTime: "* * * * *", async handler() {} })],
		{
			currentDate: new Date("2023-02-03T09:23:07.299Z"),
			store: {
				getAll() {
					return [{ id: "1", lastRun: new Date("2023-02-03T09:23:00.000Z") }];
				},
				setLastRun(id, date) {},
			},
		}
	);

	await expect(crontab.run()).resolves.toEqual([
		{ id: "1", state: "skipped", next: new Date("2023-02-03T09:24:00.000Z") },
	]);
});

test("Execute cronjobs", async () => {
	const crontab = new CronTab(
		[new CronJob({ id: "1", cronTime: "* * * * *", async handler() {} })],
		{
			currentDate: new Date("2023-02-03T09:23:07.299Z"),
			store: {
				getAll() {
					return [{ id: "1", lastRun: new Date("2023-02-03T09:22:00.000Z") }];
				},
				setLastRun(id, date) {},
			},
		}
	);

	await expect(crontab.run()).resolves.toEqual([
		{
			id: "1",
			state: "successful",
			next: new Date("2023-02-03T09:24:00.000Z"),
		},
	]);
});

test("Fail cronjobs", async () => {
	const crontab = new CronTab(
		[
			new CronJob({
				id: "1",
				cronTime: "* * * * *",
				async handler() {
					throw Error("Test error");
				},
			}),
		],
		{
			currentDate: new Date("2023-02-03T09:23:07.299Z"),
			store: {
				getAll() {
					return [{ id: "1", lastRun: new Date("2023-02-03T09:22:00.000Z") }];
				},
				setLastRun(id, date) {},
			},
		}
	);

	await expect(crontab.run()).resolves.toEqual([
		{
			id: "1",
			state: "failed",
			next: new Date("2023-02-03T09:24:00.000Z"),
		},
	]);
});
