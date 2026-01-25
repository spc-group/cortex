# Tiled in React

This package provides several hooks for retrieving data from a Tiled
web-server. Things in this package do not expect any particular
structure on the Tiled server and are meant to closely align with the
endpoints of the Tiled server.

Several custom hooks are provided that retrieve data through both HTTP
GET requests and websockets. This means the same hook will always
provide the latest data. For example, metadata can be retrieved for a
given UID using…

```javascript
import { useMetadata } from "./tiled";

const MyComponent({uid}: {uid: string}) => {
  const { metadata, isLoading, readyState } = useMetadata(uid);
};
```

…which will retrieve the initial metadata for the node using an HTTP
request and monitor for updates using websockets. The hook will
re-render the component whenever the metadata changes, and the
constant `metadata` above will always hold the latest metadata.

Most hooks return both `isLoading` to describe whether the initial (or
sometimes subsequent) HTTP requests are pending, and `readyState` to
describe the connection status of the websocket.

# `api.ts`

Tools that apply to the API as a whole, and not any particular
end-point. Includes things like:

- getApiInfo - Retrieve root-level API information.
- tiledUri - The URI to use for this server (set using the `VITE_TILED_URI` environment variable).
- v1Client - An axios client to be used by other tools to perform HTTP requests.

# `streaming.ts`

Tools related to websockets.
