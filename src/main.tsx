import { render } from "preact";
import "./global.css";

function App() {
	return (
		<div>
			<h1>Hello, Preact!</h1>
		</div>
	);
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

render(<App />, root);
