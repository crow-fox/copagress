import { createRoot } from "@remix-run/component";
import type { RemixComponent } from "./util";

const App: RemixComponent = () => {
	return () => <div>Welcome to copagress!</div>;
};

createRoot(document.body).render(<App />);
