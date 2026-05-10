/* main.tsx — application entry point.
 * Mounts the React app into <div id="root"> and wires up the API client
 * so every request automatically includes the user's access token. */

import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

/* Tell the generated API client how to retrieve the current auth token.
 * The getter is called lazily on each request, so it always reflects the
 * latest value even after login/logout. */
setAuthTokenGetter(() => localStorage.getItem("photogram_access_token"));

createRoot(document.getElementById("root")!).render(<App />);
