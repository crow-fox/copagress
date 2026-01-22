import type { Handle, RemixNode } from "@remix-run/component";

export type RemixComponent<
	Setup = unknown,
	Props extends Record<string, unknown> = Record<string, unknown>,
> = (handle: Handle, setup: Setup) => (props: Props) => RemixNode;
