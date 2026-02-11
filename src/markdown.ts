import { UnreachableError } from "./util";

export function markdownContent(lines: string[]): string {
	return lines.join("\n");
}

// 入力となる Markdown ファイルの型
export type Markdown = Readonly<{
	filename: string;
	content: string;
}>;

// Markdown -> MarkdownLine[]

type MarkdownLine = Readonly<{
	num: number; // 行番号
	text: string;
}>;

function splitMarkdown(markdown: Markdown): ReadonlyArray<MarkdownLine> {
	const lines = markdown.content.split("\n");
	return lines.map((text, index) => ({
		num: index + 1,
		text,
	}));
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("splitMarkdown", () => {
		test("複数行のMarkdownを行番号付きで行ごとにテキスト分割できる", () => {
			const markdown: Markdown = {
				filename: "sample.md",
				content: markdownContent(["行1", "行2", "行3"]),
			};

			expect(splitMarkdown(markdown)).toEqual([
				{ num: 1, text: "行1" },
				{ num: 2, text: "行2" },
				{ num: 3, text: "行3" },
			]);
		});
	});
}

function trimMarkdownLine(line: MarkdownLine): MarkdownLine {
	return {
		...line,
		text: line.text.trim(),
	};
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("trimMarkdownLine", () => {
		test("MarkdownLineのテキストの前後の空白を取り除ける", () => {
			const line: MarkdownLine = {
				num: 1,
				text: "   サンプルテキスト   ",
			};
			expect(trimMarkdownLine(line)).toEqual({
				num: 1,
				text: "サンプルテキスト",
			});
		});
	});
}

function isNonEmptyMarkdownLine(line: MarkdownLine): boolean {
	return line.text.trim() !== "";
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("isNonEmptyMarkdownLine", () => {
		test.each([
			"",
			"  ",
			"\t",
			" \n ",
			"　　　",
		])("空行(%s)のMarkdownLineはfalseを返す", (text) => {
			const emptyLine: MarkdownLine = {
				num: 1,
				text,
			};
			expect(isNonEmptyMarkdownLine(emptyLine)).toBe(false);
		});

		test("空行でないMarkdownLineはtrueを返す", () => {
			const nonEmptyLine: MarkdownLine = {
				num: 1,
				text: "サンプルテキスト",
			};
			expect(isNonEmptyMarkdownLine(nonEmptyLine)).toBe(true);
		});
	});
}

// Markdown を行ごとに分割し、空行を取り除く
function parseMarkdownToMarkdownLines(
	markdown: Markdown,
): ReadonlyArray<MarkdownLine> {
	return splitMarkdown(markdown)
		.map(trimMarkdownLine)
		.filter(isNonEmptyMarkdownLine);
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("parseMarkdownToMarkdownLines", () => {
		test("Markdownを行番号付きで行ごとに分割し、空行を取り除ける", () => {
			const markdown: Markdown = {
				filename: "sample.md",
				content: markdownContent(["行1", "", "  ", "行2", "\t", "行3"]),
			};

			expect(parseMarkdownToMarkdownLines(markdown)).toEqual([
				{ num: 1, text: "行1" },
				{ num: 4, text: "行2" },
				{ num: 6, text: "行3" },
			]);
		});
	});
}

// Markdown -> Doc に変換する処理群

type ParsedTask = Readonly<{
	name: string;
	lineNum: number; // 行番号
}>;

type StatusBase = Readonly<{
	name: string;
	symbol: string | null; // 例: "✓", "✗" // symbolがない時は null
	tasks: ReadonlyArray<ParsedTask>;
}>;

type ParsedStatus = Readonly<{
	type: "parsed";
	lineNum: number; // 行番号
}> &
	StatusBase;

type FallbackStatus = Readonly<{
	type: "fallback";
}> &
	StatusBase;

type Status = ParsedStatus | FallbackStatus;

type ProjectBase = Readonly<{
	name: string;
	statuses: ReadonlyArray<Status>;
}>;

type ParsedProject = Readonly<{
	type: "parsed";
	lineNum: number; // 行番号
}> &
	ProjectBase;

type FallbackProject = Readonly<{
	type: "fallback";
}> &
	ProjectBase;

type Project = ParsedProject | FallbackProject;

export type Doc = Readonly<{
	projects: ReadonlyArray<Project>;
}>;

// markdownLinesをflatなParseされた要素に変換する処理群

type ProjectMarkdownLine = {
	type: "project";
	name: string;
	lineNum: number;
};

type StatusMarkdownLine = {
	type: "status";
	name: string;
	symbol: string | null;
	lineNum: number;
};

type TaskMarkdownLine = {
	type: "task";
	name: string;
	lineNum: number;
};

type ParsedMarkdownLine =
	| ProjectMarkdownLine
	| StatusMarkdownLine
	| TaskMarkdownLine;

function matchProjectLine(line: MarkdownLine): ProjectMarkdownLine | null {
	if (line.text.startsWith("# ")) {
		return {
			type: "project",
			name: line.text.slice(2),
			lineNum: line.num,
		};
	}
	return null;
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("matchProjectLine", () => {
		test("見出しレベル1の行を正しくパースできる", () => {
			const line: MarkdownLine = {
				num: 1,
				text: "# サンプルプロジェクト",
			};
			const result = matchProjectLine(line);
			expect(result).toEqual({
				type: "project",
				name: "サンプルプロジェクト",
				lineNum: 1,
			});
		});

		test.each([
			"## サンプルステータス",
			"### サンプルタスク",
			"サンプルテキスト",
			"- リストアイテム",
			"1. 番号付きリスト",
		])("見出しレベル1でない行(%s)はnullを返す", (text) => {
			const line: MarkdownLine = {
				num: 2,
				text,
			};
			const result = matchProjectLine(line);
			expect(result).toEqual(null);
		});
	});
}

function matchStatusLine(line: MarkdownLine): StatusMarkdownLine | null {
	// H2見出しでなければundefinedを返す
	if (!line.text.startsWith("## ")) {
		return null;
	}
	const body = line.text.slice(3); // "## " の後ろの部分

	if (body.startsWith("[") && body.includes("]")) {
		// [何か] があるパターン
		const symbolEndIndex = body.indexOf("]");
		const symbol = body.slice(1, symbolEndIndex);
		const name = body.slice(symbolEndIndex + 1).trim();
		return {
			type: "status",
			name,
			symbol,
			lineNum: line.num,
		};
	}

	// [何か] がないパターン // あえてtrimはせずにそのまま渡す
	return {
		type: "status",
		name: body,
		symbol: null,
		lineNum: line.num,
	};
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("matchStatusLine", () => {
		test("見出しレベル2の行を正しくパースできる（シンボルあり）", () => {
			const line: MarkdownLine = {
				num: 1,
				text: "## [✓] 完了",
			};
			const result = matchStatusLine(line);
			expect(result).toEqual({
				type: "status",
				name: "完了",
				symbol: "✓",
				lineNum: 1,
			});
		});

		test("見出しレベル2の行を正しくパースできる（シンボルなし）", () => {
			const line: MarkdownLine = {
				num: 2,
				text: "## 進行中",
			};
			const result = matchStatusLine(line);
			expect(result).toEqual({
				type: "status",
				name: "進行中",
				symbol: null,
				lineNum: 2,
			});
		});

		test.each([
			"# サンプルプロジェクト",
			"### サンプルタスク",
			"サンプルテキスト",
			"- リストアイテム",
			"1. 番号付きリスト",
		])("見出しレベル2でない行(%s)はnullを返す", (text) => {
			const line: MarkdownLine = {
				num: 3,
				text,
			};
			const result = matchStatusLine(line);
			expect(result).toEqual(null);
		});
	});
}

function parseMarkdownLine(line: MarkdownLine): ParsedMarkdownLine {
	return (
		matchProjectLine(line) ??
		matchStatusLine(line) ?? {
			type: "task",
			name: line.text,
			lineNum: line.num,
		}
	);
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("parseMarkdownLine", () => {
		test("プロジェクト行を正しくパースできる", () => {
			const line: MarkdownLine = {
				num: 1,
				text: "# プロジェクトA",
			};
			const result = parseMarkdownLine(line);
			expect(result).toEqual({
				type: "project",
				name: "プロジェクトA",
				lineNum: 1,
			});
		});

		test("ステータス行を正しくパースできる", () => {
			const line: MarkdownLine = {
				num: 2,
				text: "## [✓] 完了",
			};
			const result = parseMarkdownLine(line);
			expect(result).toEqual({
				type: "status",
				name: "完了",
				symbol: "✓",
				lineNum: 2,
			});
		});

		test("タスク行を正しくパースできる", () => {
			const line: MarkdownLine = {
				num: 3,
				text: "タスク1",
			};
			const result = parseMarkdownLine(line);
			expect(result).toEqual({
				type: "task",
				name: "タスク1",
				lineNum: 3,
			});
		});
	});
}

// 最終的に Markdown -> Doc に変換する関数

export function parseMarkdown(markdown: Markdown): Doc {
	const markdownLines = parseMarkdownToMarkdownLines(markdown);

	if (markdownLines.length === 0) {
		return { projects: [] };
	}

	function fallbackStatus(tasks: ReadonlyArray<ParsedTask>): FallbackStatus {
		return {
			type: "fallback",
			name: "Fallback Status",
			symbol: null,
			tasks,
		};
	}

	const { projects } = markdownLines.reduce<{
		projects: Project[];
		currentState: {
			// 今見ている行が属するprojectを保持しておく
			// nullはfallbackとは異なり、まだprojectが一つも出現していないことを意味する（fallbackを作るときは先にstatusとかが来た場合）
			project: Project | null;
		};
	}>(
		(acc, line) => {
			const parsedLine = parseMarkdownLine(line);

			switch (parsedLine.type) {
				case "project": {
					const prevProject = acc.currentState.project;
					if (prevProject && prevProject.statuses.length === 0) {
						// １つ前のprojectにstatusesが空の場合はfallback statusを追加する
						const normalizedPrevProject: Project = {
							...prevProject,
							statuses: [fallbackStatus([])],
						};

						// projectsの最後の要素を更新しておく
						acc.projects = acc.projects.with(
							acc.projects.length - 1,
							normalizedPrevProject,
						);
					}

					const newProject: ParsedProject = {
						type: "parsed",
						name: parsedLine.name,
						lineNum: parsedLine.lineNum,
						statuses: [],
					};
					// トータルのprojectsに追加する
					acc.projects.push(newProject);
					// stateにprojectをセットする
					acc.currentState.project = newProject;
					return acc;
				}

				case "status": {
					const newStatus: ParsedStatus = {
						type: "parsed",
						name: parsedLine.name,
						symbol: parsedLine.symbol,
						lineNum: parsedLine.lineNum,
						tasks: [],
					};

					// もしcurrent.projectがnullならfallbackProjectを使う
					if (acc.currentState.project === null) {
						// 新しいprojectを作ってprojectsに追加し、stateにセットする
						const newProject: FallbackProject = {
							type: "fallback",
							name: "Fallback Project",
							statuses: [newStatus],
						};
						acc.projects.push(newProject);
						acc.currentState.project = newProject;
						return acc;
					}
					// もしcurrent.projectが存在するならそれを使う
					const currentProject = acc.currentState.project;
					// current.projectに新しいstatusを追加する
					const updatedProject: Project = {
						...currentProject,
						statuses: [...currentProject.statuses, newStatus],
					};
					// stateのprojectを更新する
					acc.currentState = {
						project: updatedProject,
					};
					// projectsの最後の要素を更新する
					acc.projects = acc.projects.with(
						acc.projects.length - 1,
						updatedProject,
					);
					return acc;
				}
				case "task": {
					const newTask: ParsedTask = {
						name: parsedLine.name,
						lineNum: parsedLine.lineNum,
					};

					// もしcurrent.projectがnullならfallbackProjectを使う
					if (acc.currentState.project === null) {
						// 新しいprojectを作ってprojectsに追加し、stateにセットする
						const newProject: FallbackProject = {
							type: "fallback",
							name: "Fallback Project",
							statuses: [fallbackStatus([newTask])],
						};
						acc.projects.push(newProject);
						acc.currentState.project = newProject;
						return acc;
					}
					// もしcurrent.projectが存在するならそれを使う
					const currentProject = acc.currentState.project;
					// 今のstatusを取得する
					const currentStatus = currentProject.statuses.at(
						currentProject.statuses.length - 1,
					);
					if (!currentStatus) {
						// statusが存在しない場合はfallback statusを作ってそこにtaskを追加する
						const fallbackStatus: FallbackStatus = {
							type: "fallback",
							name: "Fallback Status",
							symbol: null,
							tasks: [newTask],
						};
						const updatedProject: Project = {
							...currentProject,
							statuses: [fallbackStatus],
						};
						acc.projects = acc.projects.with(
							acc.projects.length - 1,
							updatedProject,
						);
						acc.currentState = {
							project: updatedProject,
						};
						return acc; // 安全策: statusが存在しない場合は何もしない
					}

					// current.statusに新しいtaskを追加する
					const updatedStatus: Status = {
						...currentStatus,
						tasks: currentStatus.tasks.concat(newTask),
					};

					const [firstStatus, ...restStatus] = currentProject.statuses.with(
						currentProject.statuses.length - 1,
						updatedStatus,
					);

					if (!firstStatus) {
						return acc; // 安全策: firstが存在しない場合は何もしない
					}

					const updatedProject: Project = {
						...currentProject,
						statuses: [firstStatus, ...restStatus],
					};

					acc.projects = acc.projects.with(
						acc.projects.length - 1,
						updatedProject,
					);
					acc.currentState = {
						project: updatedProject,
					};
					return acc;
				}
				default: {
					throw new UnreachableError(parsedLine);
				}
			}
		},
		{
			projects: [],
			currentState: { project: null },
		},
	);

	return { projects };
}
