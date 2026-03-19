import { createContext } from "react";
import type { ZarrRoot } from "./types";

export const TiledContext = createContext<{
  baseUri: string;
  pathPrefix?: string;
}>({ baseUri: "http://localhost:0" });
export const WebSocketContext = createContext("");
export const ZarrRootContext = createContext<ZarrRoot | undefined>(undefined);
