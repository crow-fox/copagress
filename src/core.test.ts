import { expect, test } from "vitest";
import { Markdown, parseMarkdownTasks, type Task, TaskStatus } from "./core";

test("空のMarkdownをパースすると空の配列が返る", () => {
	// 準備
	const markdown = Markdown("");
	// 実行
	const tasks = parseMarkdownTasks(markdown, {
		defaultProject: "",
	});
	// 検証
	expect(tasks).toEqual([] satisfies Task[]);
});

test("単純なタスクを含むMarkdownをパースできること", () => {
	// 準備
	const markdownContent = `# サンプルプロジェクト
## 未着手
タスク1
タスク2
`;
	const markdown = Markdown(markdownContent);
	// 実行
	const tasks = parseMarkdownTasks(markdown, {
		defaultProject: "",
	});
	// 検証
	expect(tasks).toEqual([
		{
			project: "サンプルプロジェクト",
			status: {
				name: "未着手",
			},
			title: "タスク1",
			markdownRow: 3,
		},
		{
			project: "サンプルプロジェクト",
			status: {
				name: "未着手",
			},
			title: "タスク2",
			markdownRow: 4,
		},
	] satisfies Task[]);
});

test("見出しレベル1がない場合、デフォルトのプロジェクトが使用される", () => {
	// 準備
	const markdownContent = `## 未着手
タスク1
`;
	const markdown = Markdown(markdownContent);
	const defaultProject = "名前なしプロジェクト";
	// 実行
	const tasks = parseMarkdownTasks(markdown, {
		defaultProject,
	});
	// 検証
	expect(tasks).toEqual([
		{
			project: defaultProject,
			status: {
				name: "未着手",
			},
			title: "タスク1",
			markdownRow: 2,
		},
	] satisfies Task[]);
});

test("見出しレベル2がない場合、デフォルトのステータスが使用される", () => {
	// 準備
	const markdownContent = `# サンプルプロジェクト
タスク1
`;
	const markdown = Markdown(markdownContent);
	const defaultStatus = TaskStatus("初期値のステータス");
	// 実行
	const tasks = parseMarkdownTasks(markdown, {
		defaultProject: "デフォルトプロジェクト",
		defaultStatus,
	});
	// 検証
	expect(tasks).toEqual([
		{
			project: "サンプルプロジェクト",
			status: defaultStatus,
			title: "タスク1",
			markdownRow: 2,
		},
	] satisfies Task[]);
});

test("見出しレベル2がない場合のデフォルトステータスは指定しない場合'未着手'", () => {
	// 準備
	const markdownContent = `# サンプルプロジェクト 
タスク1
`;
	const markdown = Markdown(markdownContent);
	// 実行
	const tasks = parseMarkdownTasks(markdown, {
		defaultProject: "デフォルトプロジェクト",
	});
	// 検証
	expect(tasks).toEqual([
		{
			project: "サンプルプロジェクト",
			status: {
				name: "未着手",
			},
			title: "タスク1",
			markdownRow: 2,
		},
	] satisfies Task[]);
});

test("Taskの行番号は元のMarkdownの行番号と一致する", () => {
	// 準備
	const markdownContent = `# プロジェクトA
## 進行中

タスク1

## 完了
タスク2
`;
	const markdown = Markdown(markdownContent);
	// 実行
	const tasks = parseMarkdownTasks(markdown, {
		defaultProject: "",
	});
	// 検証
	expect(tasks).toEqual([
		{
			project: "プロジェクトA",
			status: {
				name: "進行中",
			},
			title: "タスク1",
			markdownRow: 4,
		},
		{
			project: "プロジェクトA",
			status: {
				name: "完了",
			},
			title: "タスク2",
			markdownRow: 7,
		},
	] satisfies Task[]);
});

test("複数のプロジェクトとステータスを含むMarkdownを正しくパースできる", () => {
	// 準備
	const markdownContent = `# プロジェクトA

## 未着手
タスク1

## 完了
タスク2
タスク3

# プロジェクトB

## 未着手
タスク4

タスク5

## 進行中

タスク6
`;
	const markdown = Markdown(markdownContent);
	// 実行
	const tasks = parseMarkdownTasks(markdown, {
		defaultProject: "",
	});
	// 検証
	expect(tasks).toEqual([
		{
			project: "プロジェクトA",
			status: {
				name: "未着手",
			},
			title: "タスク1",
			markdownRow: 4,
		},
		{
			project: "プロジェクトA",
			status: {
				name: "完了",
			},
			title: "タスク2",
			markdownRow: 7,
		},
		{
			project: "プロジェクトA",
			status: {
				name: "完了",
			},
			title: "タスク3",
			markdownRow: 8,
		},
		{
			project: "プロジェクトB",
			status: {
				name: "未着手",
			},
			title: "タスク4",
			markdownRow: 13,
		},
		{
			project: "プロジェクトB",
			status: {
				name: "未着手",
			},
			title: "タスク5",
			markdownRow: 15,
		},
		{
			project: "プロジェクトB",
			status: {
				name: "進行中",
			},
			title: "タスク6",
			markdownRow: 19,
		},
	] satisfies Task[]);
});

test("見出しレベル1より前に存在するステータスや行はデフォルトのプロジェクトに属する", () => {
	// 準備
	const markdownContent = `## 未着手
タスク1

# プロジェクトA
## 進行中
タスク2
`;
	const markdown = Markdown(markdownContent);
	const defaultProject = "デフォルトプロジェクト";
	// 実行
	const tasks = parseMarkdownTasks(markdown, {
		defaultProject,
	});
	// 検証
	expect(tasks).toEqual([
		{
			project: defaultProject,
			status: {
				name: "未着手",
			},
			title: "タスク1",
			markdownRow: 2,
		},
		{
			project: "プロジェクトA",
			status: {
				name: "進行中",
			},
			title: "タスク2",
			markdownRow: 6,
		},
	] satisfies Task[]);
});

test("見出しレベル1, 2以外のMarkdown構文は、そのままタスク名に含まれる", () => {
	// 準備
	const markdownContent = `# プロジェクトA
## 未着手
- タスク1
* タスク2
### タスク3
`;
	const markdown = Markdown(markdownContent);
	// 実行
	const tasks = parseMarkdownTasks(markdown, {
		defaultProject: "",
	});
	// 検証
	expect(tasks).toEqual([
		{
			project: "プロジェクトA",
			status: {
				name: "未着手",
			},
			title: "- タスク1",
			markdownRow: 3,
		},
		{
			project: "プロジェクトA",
			status: {
				name: "未着手",
			},
			title: "* タスク2",
			markdownRow: 4,
		},
		{
			project: "プロジェクトA",
			status: {
				name: "未着手",
			},
			title: "### タスク3",
			markdownRow: 5,
		},
	] satisfies Task[]);
});

test("# プロジェクト 出現時に、statusをdefaultStatusにリセットする", () => {
	// 準備
	const markdownContent = `# プロジェクトA
## 進行中
タスク1
# プロジェクトB
タスク2
`;
	const markdown = Markdown(markdownContent);
	const defaultStatus = TaskStatus("未着手");
	// 実行
	const tasks = parseMarkdownTasks(markdown, {
		defaultProject: "",
		defaultStatus,
	});
	// 検証
	expect(tasks).toEqual([
		{
			project: "プロジェクトA",
			status: {
				name: "進行中",
			},
			title: "タスク1",
			markdownRow: 3,
		},
		{
			project: "プロジェクトB",
			status: defaultStatus,
			title: "タスク2",
			markdownRow: 5,
		},
	] satisfies Task[]);
});

test.todo("## ステータス の名前が同じプロジェクト内で重複している場合、mergeされる", () => {});

test.todo("# プロジェクト が重複している場合、mergeされる", () => {});
