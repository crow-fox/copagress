import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { useEffect, useRef, useState } from "preact/hooks";
import type { Markdown } from "./markdown.ts";

type Props = {
	initialValue: Markdown;
	onChange: (markdown: Markdown) => void;
	onSave: (markdown: Markdown) => void;
};

export function MarkdownEditor({ initialValue, onChange, onSave }: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [initMarkdown] = useState(initialValue); // 同じ値として保持することで、initialValueが変わってもエディタの内容がリセットされないようにする

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const state = EditorState.create({
			doc: initMarkdown.content, // 初期値をpropsから受け取るように変更
			extensions: [
				basicSetup,
				markdown(),
				EditorView.lineWrapping,
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
					onChange({ filename: initMarkdown.filename, content: next });
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

	return <div ref={containerRef} />;
}
