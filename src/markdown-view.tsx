import { type Markdown, parseMarkdown } from "./markdown.ts";
import { useEffect, useMemo, useState } from "preact/hooks";
import styles from "./markdown-view.module.css";

type Props = {
	markdown: Markdown;
};

export function MarkdownView({ markdown }: Props) {
	const doc = parseMarkdown(markdown, {
		fallbackStatus: {
			name: "未定義",
			symbol: null,
		},
	});
	const projectOptions = useMemo(
		() => doc.projects.map((project) => project.name),
		[doc.projects],
	);
	const [selectedProjectName, setSelectedProjectName] = useState(
		projectOptions[0] ?? "",
	);

	useEffect(() => {
		if (!projectOptions.includes(selectedProjectName)) {
			setSelectedProjectName(projectOptions[0] ?? "");
		}
	}, [projectOptions, selectedProjectName]);

	const selectedProject =
		doc.projects.find((project) => project.name === selectedProjectName) ?? null;

	return (
		<div className={styles.wrapper}>
			<div className={styles.toolbar}>
				<select
					className={styles.projectSelect}
					value={selectedProjectName}
					onChange={(event) =>
						setSelectedProjectName(event.currentTarget.value)
					}
				>
					{projectOptions.map((projectName) => (
						<option key={projectName} value={projectName}>
							{projectName}
						</option>
					))}
				</select>
			</div>

			{selectedProject && (
				<section
					className={styles.project}
					key={`${selectedProject.type}-${selectedProject.name}`}
				>
					{selectedProject.statuses.map((status) => (
						<div
							className={styles.status}
							key={`${selectedProject.name}-${status.type}-${status.name}`}
						>
							<div className={styles.statusHeader}>
								<h3 className={styles.statusTitle}>
									{status.symbol
										? `${status.symbol} ${status.name}`
										: status.name}
								</h3>
								<span className={styles.taskCount}>
									{status.tasks.length} tasks
								</span>
							</div>

							{status.tasks.length > 0 ? (
								<ul className={styles.taskList}>
									{status.tasks.map((task) => (
										<li className={styles.taskItem} key={task.lineNum}>
											<span className={styles.taskMarker} aria-hidden="true" />
											<span className={styles.taskName}>{task.name}</span>
											<span className={styles.taskMeta}>L{task.lineNum}</span>
										</li>
									))}
								</ul>
							) : (
								<p className={styles.emptyTasks}>タスクはありません</p>
							)}
						</div>
					))}
				</section>
			)}
		</div>
	);
}
