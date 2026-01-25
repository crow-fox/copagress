export type Markdown = {
	type: "markdown";
	content: string;
};

export function Markdown(content: string): Markdown {
	return {
		type: "markdown",
		content,
	};
}

export type Task = {
	project: string; // H1 のテキスト or ファイル名
	status: string; // H2 のテキスト or "未定義"
	title: string; // タスクのテキスト（先頭空白は削除）
	markdownRow: number; // 元ドキュメント内の行番号（重複しないのでリスト表示のkeyにしようできる）ソートにも利用可能（orderの代わり）
};

export const parseMarkdownTasks = (
	markdown: Markdown,
	options: {
		defaultProject: string;
		defaultStatus?: string;
	},
): Task[] => {
	const defaultStatus = options.defaultStatus ?? "未着手";
	// markdownから、タスクを独自のロジックに基づいて、Task[]に変換する処理を実装してください。
	const lines = markdown.content
		// まずは行ごとに分割
		.split("\n")
		.map((line, index) => ({ line, row: index + 1 }) as const)
		// パフォーマンスを考慮してreduceで１ループでいろんな処理をまとめて実行
		.reduce<{ line: string; markdownRow: number }[]>((acc, { line, row }) => {
			// 先頭と末尾の空白を削除
			const trimmedLine = line.trim();
			// 空行をスキップ
			if (!trimmedLine) {
				return acc;
			}
			// 必要な行は追加する
			// 本来はここで、一気にTasksへの変換も実装するべき（パフォーマンス向上のため）

			acc.push({ line: trimmedLine, markdownRow: row });
			return acc;
		}, []);

	const { tasks } = lines.reduce<{
		tasks: Task[];
		current: {
			project: string;
			status: string;
		};
	}>(
		(acc, current) => {
			// #+" " で始まる行はプロジェクト名として扱う
			const isProjectLine = /^# +/.test(current.line);
			if (isProjectLine) {
				// プロジェクト名を抽出して、現在のprojectに設定
				acc.current.project = current.line.replace(/^# +/, "");
				// ステータスをデフォルトにリセット
				acc.current.status = defaultStatus;
				return acc; // タスクではないので何も追加しない
			}

			// ##+" " で始まる行はステータス名として扱う
			const isStatusLine = /^## +/.test(current.line);
			if (isStatusLine) {
				// ステータス名を抽出して、現在のstatusに設定
				acc.current.status = current.line.replace(/^## +/, "");
				return acc; // タスクではないので何も追加しない
			}

			// それ以外の行はタスクとして扱う
			acc.tasks.push({
				project: acc.current.project,
				status: acc.current.status,
				title: current.line,
				markdownRow: current.markdownRow, // 行番号は1始まりにする
			});
			return acc;
		},
		{
			tasks: [],
			current: {
				project: options.defaultProject,
				status: defaultStatus,
			},
		},
	);

	return tasks;
};
