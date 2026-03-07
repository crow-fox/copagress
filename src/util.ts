export class UnreachableError extends Error {
	constructor(value: never) {
		super(`Unreachable value: ${JSON.stringify(value)}`);
	}
}

export function debounce<T extends (...args: never[]) => void>(
	fn: T,
	delayMs: number,
) {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	return (...args: Parameters<T>) => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			fn(...args);
		}, delayMs);
	};
}
