import { describe, expect, test, vi } from "vitest";
import { debounce } from "./util.ts";

describe("debounce", () => {
	test("連続呼び出し時に最後の1回だけ実行する", () => {
		vi.useFakeTimers();

		const fn = vi.fn<(value: number) => void>();
		const debounced = debounce(fn, 100);

		debounced(1);
		debounced(2);
		debounced(3);
		vi.advanceTimersByTime(100);

		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith(3);

		vi.useRealTimers();
	});

	test("待機時間に達するまでは実行しない", () => {
		vi.useFakeTimers();
		const fn = vi.fn<() => void>();
		const debounced = debounce(fn, 100);

		debounced();
		vi.advanceTimersByTime(99);

		expect(fn).not.toHaveBeenCalled();
		vi.useRealTimers();
	});
});
