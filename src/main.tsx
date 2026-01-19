import { createRoot, type Handle, type RemixNode } from "@remix-run/component";

function App(this: Handle): () => RemixNode {
	
	return () => {
		return <div>Welcome to copagress!</div>;
	}
}

createRoot(document.body).render(<App />);
