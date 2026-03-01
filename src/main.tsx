import { render } from "preact";
import { App } from "./app.tsx";
import "./global.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

render(<App />, root);
