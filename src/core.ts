import { UnreachableError } from "./util";

export type Markdown = Readonly<{
	type: "markdown";
	content: string;
}>;

export function Markdown(content: string): Markdown {
	return {
		type: "markdown",
		content,
	};
}

export type TaskStatus = Readonly<{
	// 拡張できるように、object型で定義しておく
	name: string;
}>;

export function TaskStatus(name: string): TaskStatus {
	return { name };
}

export type Task = Readonly<{
	project: string; // H1 のテキスト or ファイル名
	status: TaskStatus; // H2 のテキスト or "未定義"
	title: string; // タスクのテキスト（先頭空白は削除）
	markdownRow: number; // 元ドキュメント内の行番号（重複しないのでリスト表示のkeyにしようできる）ソートにも利用可能（orderの代わり）
}>;

function taskFactory(overrides: Partial<Task> = {}): Task {
	return {
		project: "Default Project",
		status: TaskStatus("未着手"),
		title: "Default Task",
		markdownRow: 1,
		...overrides,
	};
}

export const parseMarkdownTasks = (
	markdown: Markdown,
	options: {
		defaultProject: string;
		defaultStatus?: TaskStatus;
	},
): ReadonlyArray<Task> => {
	const defaultStatus = options.defaultStatus ?? TaskStatus("未着手");

	// Markdownを行ごとに分割（その際に元の行番号も保持）
	return (
		splitMarkdownLines(markdown)
			// 各行の前後の空白を削除
			.map(trimLine)
			// 空行を除去
			.filter(isNonEmptyLine)
			// 各行を順にパースして、対応した構造化されたデータに変換
			.reduce(
				markdownLineParseReducer({ defaultStatus }),
				markdownLineParseReducerInitialAcc({
					defaultProject: options.defaultProject,
					defaultStatus,
				}),
			).tasks
	);
};

type MarkdownLine = Readonly<{
	text: string;
	row: number;
}>;

function MarkdownLine(text: string, row: number): MarkdownLine {
	return { text, row };
}

function splitMarkdownLines(markdown: Markdown): MarkdownLine[] {
	return markdown.content
		.split("\n")
		.map((line, index) => MarkdownLine(line, index + 1));
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("splitMarkdownLines", () => {
		test("Markdown文字列を行ごとにテキスト分割し、行番号を付与する", () => {
			// 準備
			const markdown = Markdown(markdownContent(["Line 1", "", "Line 2"]));
			// 実行
			const lines = splitMarkdownLines(markdown);
			// 検証
			expect(lines).toEqual([
				MarkdownLine("Line 1", 1),
				MarkdownLine("", 2),
				MarkdownLine("Line 2", 3),
			]);
		});
	});
}

function trimLine(line: MarkdownLine): MarkdownLine {
	return {
		...line,
		text: line.text.trim(),
	};
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("trimLine", () => {
		test.each([
			[MarkdownLine("  a", 1), MarkdownLine("a", 1)],
			[MarkdownLine("b  ", 2), MarkdownLine("b", 2)],
			[MarkdownLine("  c  ", 3), MarkdownLine("c", 3)],
			[MarkdownLine("d", 4), MarkdownLine("d", 4)],
			[MarkdownLine("    ", 5), MarkdownLine("", 5)],
			[MarkdownLine("", 6), MarkdownLine("", 6)],
		])("行の前後の空白を削除する (%o => %o)", (input, expected) => {
			expect(trimLine(input)).toEqual(expected);
		});
	});
}

function isNonEmptyLine(line: MarkdownLine): boolean {
	return line.text.trim() !== "";
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("isNonEmptyLine", () => {
		test("空行でない場合にtrueを返す", () => {
			const line = MarkdownLine("Some text", 1);
			expect(isNonEmptyLine(line)).toBe(true);
		});

		test("空行の場合にfalseを返す", () => {
			const line: MarkdownLine = { text: "", row: 1 };
			expect(isNonEmptyLine(line)).toBe(false);
		});
	});
}

function getProject(line: MarkdownLine): string | undefined {
	if (line.text.startsWith("# ")) {
		return line.text.slice(2);
	}
	return undefined;
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("getProject", () => {
		test.each([
			["# My Project", "My Project"],
			["# # Another Project", "# Another Project"],
		] as const)("行がH1見出し(%s)の場合、行頭の[# ] を除いた文字列(%s)をプロジェクトとして返す", (input, expected) => {
			const line = MarkdownLine(input, 1);
			expect(getProject(line)).toEqual(expected);
		});

		test.each([
			"## Not a Project",
			"### Also Not a Project",
			"- Not a Project",
			"Just some text",
			"",
		] as const)("行がH1見出しでない（%s）場合、undefinedを返す", (input) => {
			const line = MarkdownLine(input, 2);
			expect(getProject(line)).toEqual(undefined);
		});
	});
}

function getStatus(line: MarkdownLine): TaskStatus | undefined {
	if (line.text.startsWith("## ")) {
		return TaskStatus(line.text.slice(3));
	}
	return undefined;
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("getStatus", () => {
		test.each([
			["## In Progress", "In Progress"],
			["## ## Another Status", "## Another Status"],
		] as const)("行がH2見出し(%s)の場合、行頭の[## ] を除いた文字列(%s)をステータスとして返す", (input, expected) => {
			const line = MarkdownLine(input, 1);
			expect(getStatus(line)).toEqual(TaskStatus(expected));
		});

		test.each([
			"# Not a Status",
			"### Also Not a Status",
			"- Not a Status",
			"Just some text",
			"",
		] as const)("行がH2見出しでない（%s）場合、undefinedを返す", (input) => {
			const line = MarkdownLine(input, 2);
			expect(getStatus(line)).toEqual(undefined);
		});
	});
}

// MarkdownLineから必要な役割の行を抽出する関数
type ParsedMarkdownLine =
	| { type: "project"; title: string }
	| { type: "status"; status: TaskStatus }
	| { type: "task"; title: string };

function parseMarkdownLine(line: MarkdownLine): ParsedMarkdownLine {
	{
		const project = getProject(line);
		if (project) {
			return { type: "project", title: project };
		}
	}
	{
		const status = getStatus(line);
		if (status) {
			return { type: "status", status };
		}
	}
	return { type: "task", title: line.text };
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("parseMarkdownLine", () => {
		test("H1見出しの行をプロジェクト行としてパースする", () => {
			const line = MarkdownLine("# Project A", 1);
			const parsed = parseMarkdownLine(line);
			expect(parsed).toEqual({ type: "project", title: "Project A" });
		});

		test("H2見出しの行をステータス行としてパースする", () => {
			const line = MarkdownLine("## In Progress", 2);
			const parsed = parseMarkdownLine(line);
			expect(parsed).toEqual({
				type: "status",
				status: TaskStatus("In Progress"),
			});
		});

		test("その他の行をタスク行としてパースする", () => {
			const lines = ["- Task 1", "Complete the report"].map((text, index) =>
				MarkdownLine(text, index + 1),
			);
			for (const line of lines) {
				const parsed = parseMarkdownLine(line);
				expect(parsed).toEqual({ type: "task", title: line.text });
			}
		});
	});
}

type MarkdownLineParseReducerAcc = {
	tasks: Task[];
	current: {
		project: string;
		status: TaskStatus;
	};
};

function markdownLineParseReducerInitialAcc({
	defaultProject,
	defaultStatus,
}: {
	defaultProject: string;
	defaultStatus: TaskStatus;
}): MarkdownLineParseReducerAcc {
	return {
		tasks: [],
		current: {
			project: defaultProject,
			status: defaultStatus,
		},
	};
}

function markdownLineParseReducer({
	defaultStatus,
}: {
	defaultStatus: TaskStatus;
}) {
	return (
		acc: MarkdownLineParseReducerAcc,
		line: MarkdownLine,
	): MarkdownLineParseReducerAcc => {
		const parsed = parseMarkdownLine(line);

		switch (parsed.type) {
			case "project": {
				return {
					tasks: acc.tasks,
					current: {
						project: parsed.title,
						status: defaultStatus,
					},
				};
			}
			case "status": {
				return {
					tasks: acc.tasks,
					current: {
						...acc.current,
						status: parsed.status,
					},
				};
			}
			case "task": {
				return {
					tasks: [
						...acc.tasks,
						{
							project: acc.current.project,
							status: acc.current.status,
							title: line.text,
							markdownRow: line.row,
						},
					],
					current: acc.current,
				};
			}
			default:
				throw new UnreachableError(parsed);
		}
	};
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("markdownLineParseReducer", () => {
		test("Accumulatorの初期値を正しく設定する", () => {
			const defaultProject = "プロジェクト名";
			const defaultStatus = TaskStatus("ステータス名");
			const initialAcc = markdownLineParseReducerInitialAcc({
				defaultProject,
				defaultStatus,
			});
			expect(initialAcc).toEqual({
				tasks: [],
				current: {
					project: defaultProject,
					status: defaultStatus,
				},
			});
		});

		test("Accumulatorにタスクを追加する", () => {
			const firstTask = taskFactory({
				project: "今のプロジェクト",
				status: TaskStatus("今のステータス"),
				title: "既存のタスク",
				markdownRow: 1,
			});
			const currentAcc: MarkdownLineParseReducerAcc = {
				tasks: [firstTask],
				current: {
					project: "今のプロジェクト",
					status: TaskStatus("今のステータス"),
				},
			};
			const line = MarkdownLine("タスク1", 3);
			const reducer = markdownLineParseReducer({
				defaultStatus: TaskStatus("初期ステータス"),
			});
			const newAcc = reducer(currentAcc, line);
			expect(newAcc).toEqual({
				tasks: [
					firstTask,
					taskFactory({
						project: "今のプロジェクト",
						status: TaskStatus("今のステータス"),
						title: "タスク1",
						markdownRow: 3,
					}),
				],
				current: {
					project: "今のプロジェクト",
					status: TaskStatus("今のステータス"),
				},
			});
		});

		test("プロジェクト行で現在のプロジェクトを更新して、ステータスを初期化する", () => {
			const firstTask = taskFactory({
				project: "古いプロジェクト",
				status: TaskStatus("今のステータス"),
				title: "タスク1",
				markdownRow: 2,
			});
			const currentAcc: MarkdownLineParseReducerAcc = {
				tasks: [firstTask],
				current: {
					project: "古いプロジェクト",
					status: TaskStatus("今のステータス"),
				},
			};
			const line = MarkdownLine("# 新しいプロジェクト", 1);
			const reducer = markdownLineParseReducer({
				defaultStatus: TaskStatus("初期ステータス"),
			});
			const newAcc = reducer(currentAcc, line);
			expect(newAcc).toEqual({
				tasks: [firstTask],
				current: {
					project: "新しいプロジェクト",
					status: TaskStatus("初期ステータス"),
				},
			});
		});

		test("ステータス行で現在のステータスを更新する", () => {
			const firstTask = taskFactory({
				project: "今のプロジェクト",
				status: TaskStatus("古いステータス"),
				title: "タスク1",
				markdownRow: 2,
			});
			const currentAcc: MarkdownLineParseReducerAcc = {
				tasks: [firstTask],
				current: {
					project: "今のプロジェクト",
					status: TaskStatus("古いステータス"),
				},
			};
			const line = MarkdownLine("## 新しいステータス", 1);
			const reducer = markdownLineParseReducer({
				defaultStatus: TaskStatus("初期ステータス"),
			});
			const newAcc = reducer(currentAcc, line);
			expect(newAcc).toEqual({
				tasks: [firstTask],
				current: {
					project: "今のプロジェクト",
					status: TaskStatus("新しいステータス"),
				},
			});
		});
	});
}

// テスト用のMarkdownコンテンツを作成するユーティリティ関数
// markdownを``で囲むと見づらいので、配列で行ごとに与えて結合する形式にする
function markdownContent(lines: string[]): string {
	return lines.join("\n");
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("markdownContent", () => {
		test("複数行の文字列配列を結合してMarkdownコンテンツを作成できる", () => {
			// 準備
			const lines = [
				"# 見出し1",
				"",
				"## 見出し2",
				"段落",
				"- リストアイテム1",
				"- リストアイテム2",
			];
			// 実行
			const content = markdownContent(lines);
			// 検証
			expect(content).toEqual(`# 見出し1

## 見出し2
段落
- リストアイテム1
- リストアイテム2`);
		});
	});
}
