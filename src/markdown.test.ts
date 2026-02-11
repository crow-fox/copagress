import { expect, test } from "vitest";
import { type Doc, markdownContent, parseMarkdown } from "./markdown";

test("空のMarkdownをパースすると projects は空配列になる", () => {
	const content = markdownContent([]);
	const doc = parseMarkdown({ filename: "", content });
	expect(doc).toEqual({ projects: [] });
});

test("2. 単一プロジェクト・単一ステータス・複数タスクをパースできる", () => {
	const content = markdownContent([
		"# サンプルプロジェクト",
		"## 未着手",
		"タスク1",
		"タスク2",
	]);

	const doc = parseMarkdown({ filename: "", content });

	expect(doc).toEqual({
		projects: [
			{
				type: "parsed",
				name: "サンプルプロジェクト",
				lineNum: 1,
				statuses: [
					{
						type: "parsed",
						name: "未着手",
						symbol: null,
						lineNum: 2,
						tasks: [
							{ name: "タスク1", lineNum: 3 },
							{ name: "タスク2", lineNum: 4 },
						],
					},
				],
			},
		],
	} satisfies Doc);
});

test("見出しレベル1より先のステータス/タスクは fallback プロジェクト(プロジェクト名はファイル名）に属する", () => {
	const content = markdownContent([
		"## 未着手",
		"タスク1",
		"# プロジェクトA",
		"## 進行中",
		"タスク2",
	]);

	const doc = parseMarkdown({ filename: "ファイル名", content });

	expect(doc).toEqual({
		projects: [
			{
				type: "fallback",
				name: "ファイル名",
				statuses: [
					{
						type: "parsed",
						name: "未着手",
						symbol: null,
						lineNum: 1,
						tasks: [{ name: "タスク1", lineNum: 2 }],
					},
				],
			},
			{
				type: "parsed",
				name: "プロジェクトA",
				lineNum: 3,
				statuses: [
					{
						type: "parsed",
						name: "進行中",
						symbol: null,
						lineNum: 4,
						tasks: [{ name: "タスク2", lineNum: 5 }],
					},
				],
			},
		],
	} satisfies Doc);
});

test("ステータスにシンボルがある形式をパースできる", () => {
	const content = markdownContent([
		"# プロジェクトA",
		"## [✖️] 未着手",
		"タスク1",
	]);

	const doc = parseMarkdown({ filename: "", content });

	expect(doc).toEqual({
		projects: [
			{
				type: "parsed",
				name: "プロジェクトA",
				lineNum: 1,
				statuses: [
					{
						type: "parsed",
						name: "未着手",
						symbol: "✖️",
						lineNum: 2,
						tasks: [{ name: "タスク1", lineNum: 3 }],
					},
				],
			},
		],
	} satisfies Doc);
});

test("新しいプロジェクト出現時にステータスがリセットされ、次のタスクは fallback 状態になる", () => {
	const content = markdownContent([
		"# プロジェクトA",
		"## 進行中",
		"タスク1",
		"# プロジェクトB",
		"タスク2",
	]);

	const doc = parseMarkdown({ filename: "", content });

	expect(doc).toEqual({
		projects: [
			{
				type: "parsed",
				name: "プロジェクトA",
				lineNum: 1,
				statuses: [
					{
						type: "parsed",
						name: "進行中",
						symbol: null,
						lineNum: 2,
						tasks: [{ name: "タスク1", lineNum: 3 }],
					},
				],
			},
			{
				type: "parsed",
				name: "プロジェクトB",
				lineNum: 4,
				statuses: [
					{
						type: "fallback",
						name: "Fallback Status",
						symbol: null,
						tasks: [{ name: "タスク2", lineNum: 5 }],
					},
				],
			},
		],
	} satisfies Doc);
});

test("連続する H1 があり間に何もない時、タスクは後のプロジェクトの fallback status に属する", () => {
	const content = markdownContent(["# A", "# B", "タスク1"]);

	const doc = parseMarkdown({ filename: "", content });

	expect(doc).toEqual({
		projects: [
			{
				type: "parsed",
				name: "A",
				lineNum: 1,
				statuses: [
					{
						type: "fallback",
						name: "Fallback Status",
						symbol: null,
						tasks: [],
					},
				],
			},
			{
				type: "parsed",
				name: "B",
				lineNum: 2,
				statuses: [
					{
						type: "fallback",
						name: "Fallback Status",
						symbol: null,
						tasks: [{ name: "タスク1", lineNum: 3 }],
					},
				],
			},
		],
	} satisfies Doc);
});

test("プロジェクト直後にステータスなしでタスクが来る場合、タスクはそのプロジェクトの fallback status に属する", () => {
	const content = markdownContent(["# P", "タスク1"]);

	const doc = parseMarkdown({ filename: "", content });

	expect(doc).toEqual({
		projects: [
			{
				type: "parsed",
				name: "P",
				lineNum: 1,
				statuses: [
					{
						type: "fallback",
						name: "Fallback Status",
						symbol: null,
						tasks: [{ name: "タスク1", lineNum: 2 }],
					},
				],
			},
		],
	} satisfies Doc);
});

test("ファイル先頭にステータスとタスクがあり、その後にプロジェクトが来る場合、先頭は fallback プロジェクト、その後のタスクは新しいプロジェクトに属する", () => {
	const content = markdownContent(["## S", "タスク1", "# P", "タスク2"]);

	const doc = parseMarkdown({ filename: "ファイル名", content });

	expect(doc).toEqual({
		projects: [
			{
				type: "fallback",
				name: "ファイル名",
				statuses: [
					{
						type: "parsed",
						name: "S",
						symbol: null,
						lineNum: 1,
						tasks: [{ name: "タスク1", lineNum: 2 }],
					},
				],
			},
			{
				type: "parsed",
				name: "P",
				lineNum: 3,
				statuses: [
					{
						type: "fallback",
						name: "Fallback Status",
						symbol: null,
						tasks: [{ name: "タスク2", lineNum: 4 }],
					},
				],
			},
		],
	} satisfies Doc);
});

test("連続する H2 がありタスクがない場合、両方のステータスが存在し tasks: [] になる", () => {
	const content = markdownContent(["# P", "## S1", "## S2"]);

	const doc = parseMarkdown({ filename: "", content });

	expect(doc).toEqual({
		projects: [
			{
				type: "parsed",
				name: "P",
				lineNum: 1,
				statuses: [
					{ type: "parsed", name: "S1", symbol: null, lineNum: 2, tasks: [] },
					{ type: "parsed", name: "S2", symbol: null, lineNum: 3, tasks: [] },
				],
			},
		],
	} satisfies Doc);
});
