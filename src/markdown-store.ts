import { useEffect, useState } from "preact/hooks";
import * as v from "valibot";
import { type Markdown, markdownSchema } from "./markdown.ts";

const MARKDOWN_STORAGE_KEY = "copagress_markdown";

function loadMarkdown(): Markdown {
	const jsonString = localStorage.getItem(MARKDOWN_STORAGE_KEY);
	const maybeMarkdown = jsonString ? JSON.parse(jsonString) : null;
	const parseResult = v.safeParse(markdownSchema, maybeMarkdown);
	if (parseResult.success) {
		return parseResult.output;
	}
	return { filename: "markdown.md", content: "" };
}

function saveMarkdown(markdown: Markdown): void {
	const jsonString = JSON.stringify(markdown);
	localStorage.setItem(MARKDOWN_STORAGE_KEY, jsonString);
}

export function useMarkdownStorage() {
	const [markdown, setMarkdown] = useState<Markdown | null>(null);

	useEffect(() => {
		setMarkdown(loadMarkdown());
	}, []);

	useEffect(() => {
		if (markdown) {
			saveMarkdown(markdown);
		}
	}, [markdown]);

	return [markdown, setMarkdown] as const;
}
