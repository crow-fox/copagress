import { type Markdown, parseMarkdown } from "./markdown.ts";

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

	return (
		<div>
			{doc.projects.map((project) => (
				<section key={`${project.type}-${project.name}`}>
					<h2>{project.name}</h2>
					{project.statuses.map((status) => (
						<div key={`${project.name}-${status.type}-${status.name}`}>
							<h3>
								{status.symbol
									? `${status.symbol} ${status.name}`
									: status.name}
							</h3>
							<ul>
								{status.tasks.map((task) => (
									<li key={task.lineNum}>{task.name}</li>
								))}
							</ul>
						</div>
					))}
				</section>
			))}
		</div>
	);
}
