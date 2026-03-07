import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { useEffect, useRef, useState } from "preact/hooks";
import type { Markdown } from "./markdown.ts";
import styles from "./markdown-editor.module.css";
import { debounce } from "./util.ts";

type Props = {
	initialValue: Markdown;
	onChange: (markdown: Markdown) => void;
	onSave: (markdown: Markdown) => void;
};

const monochromeTheme = EditorView.theme({
	"&": {
		height: "100svh",
		backgroundColor: "#ffffff",
		color: "#111111",
		fontSize: "14px",
		fontFamily: "sans-serif",
		lineHeight: "1.75",
	},
	".cm-content": {
		padding: "8px",
	},
	".cm-gutters": {
		backgroundColor: "#fafafa",
		color: "#6b7280",
		borderRight: "1px solid #e5e7eb",
	},
	".cm-activeLine, .cm-activeLineGutter": {
		backgroundColor: "#f3f4f6",
	},
});

export function MarkdownEditor({ initialValue, onChange, onSave }: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [initMarkdown] = useState(initialValue); // 同じ値として保持することで、initialValueが変わってもエディタの内容がリセットされないようにする

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const debouncedOnChange = debounce(onChange, 300);

		const state = EditorState.create({
			doc: initMarkdown.content, // 初期値をpropsから受け取るように変更
			extensions: [
				basicSetup,
				markdown(),
				EditorView.lineWrapping,
				monochromeTheme,
				keymap.of([
					{
						key: "Mod-s",
						preventDefault: true,
						run(view) {
							onSave({
								filename: initMarkdown.filename,
								content: view.state.doc.toString(),
							});
							return true;
						},
					},
				]),
				EditorView.updateListener.of((update) => {
					if (!update.docChanged) return;
					const next = update.state.doc.toString();
					// onChangeは頻繁に呼び出される可能性があるため、debounceして呼び出す
					debouncedOnChange({ filename: initMarkdown.filename, content: next });
				}),
			],
		});

		const editorView = new EditorView({
			state,
			parent: container,
		});

		return () => {
			editorView.destroy();
		};
	}, [onChange, onSave, initMarkdown.content, initMarkdown.filename]); // defaultValueを依存配列に追加

	return (
		<div className={styles.wrapper}>
			<div className={styles.editor} ref={containerRef} />
		</div>
	);
}
