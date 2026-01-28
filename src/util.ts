import type { Handle, RemixNode } from "remix/component";

export type RemixComponent<
	Setup = unknown,
	Props extends Record<string, unknown> = Record<string, unknown>,
> = (handle: Handle, setup: Setup) => (props: Props) => RemixNode;

export class UnreachableError extends Error {
	constructor(value: never) {
		super(`Unreachable value: ${JSON.stringify(value)}`);
	}
}
