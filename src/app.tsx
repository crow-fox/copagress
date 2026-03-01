import styles from "./app.module.css";
import { MarkdownEditor } from "./markdown-editor.tsx";
import { useMarkdownStorage } from "./markdown-store.ts";
import { MarkdownView } from "./markdown-view.tsx";

export function App() {
	const [markdown, setMarkdown] = useMarkdownStorage();

	return (
		<main class={styles.main}>
			<h1 class="sr-only">Copagress</h1>
			{markdown && (
				<>
					<MarkdownEditor
						initialValue={markdown}
						onChange={setMarkdown}
						onSave={setMarkdown}
					/>
					<MarkdownView markdown={markdown} />
				</>
			)}
		</main>
	);
}
