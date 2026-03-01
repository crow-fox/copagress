import { render } from "preact";
import { MarkdownEditor } from "./markdown-editor.tsx";
import { useMarkdownStorage } from "./markdown-store.ts";
import { MarkdownView } from "./markdown-view.tsx";
import "./global.css";

function App() {
	const [markdown, setMarkdown] = useMarkdownStorage();

	return (
		<div
			style={{
				display: "grid",
				gap: "16px",
				gridTemplateColumns: "1fr 1fr",
			}}
		>
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
		</div>
	);
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

render(<App />, root);
