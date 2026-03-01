export class UnreachableError extends Error {
	constructor(value: never) {
		super(`Unreachable value: ${JSON.stringify(value)}`);
	}
}
