import { createRoot } from "remix/component";
import type { RemixComponent } from "./util";

const App: RemixComponent = () => {
	return () => <div>Welcome to copagress!</div>;
};

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(<App />);
