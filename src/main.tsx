import { render } from "preact";
import { MarkdownEditor } from "./markdown-editor.tsx";
import { useMarkdownStorage } from "./markdown-store.ts";
import { MarkdownView } from "./markdown-view.tsx";
import "./global.css";
import styles from "./main.module.css";

function App() {
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

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

render(<App />, root);
