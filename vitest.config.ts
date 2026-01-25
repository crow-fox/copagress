import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					include: ["./src/**/*.test.ts"],
					// browserがついているテストファイルは除外
					exclude: ["./src/**/*.browser.test.ts"],
					name: { label: "normal", color: "green" },
					// テストエラーまでの時間を5sに設定
					testTimeout: 1000,
				},
			},
			{
				test: {
					include: ["./src/**/*.browser.test.ts"],
					name: { label: "browser", color: "blue" },
					// テストエラーまでの時間を2sに設定
					testTimeout: 2000,
					browser: {
						provider: playwright(),
						enabled: true,
						// at least one instance is required
						instances: [{ browser: "chromium" }],
						// ブラウザを開かない
						headless: true,
						// テストが失敗したときにスクリーンショットを撮らない
						screenshotFailures: false,
					},
				},
			},
		],
	},
});
