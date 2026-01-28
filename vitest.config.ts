import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					// browserがついているテストファイルは除外
					includeSource: ["./src/**/*.{ts,tsx}"],
					name: { label: "normal", color: "green" },
					// テストエラーまでの時間を5sに設定
					testTimeout: 1000,
				},
			},
		],
	},
});
