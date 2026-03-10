import { createContext } from "react";
import type { ZarrRoot } from "./types";

export const TiledContext = createContext("");
export const WebSocketContext = createContext("");
export const ZarrRootContext = createContext<ZarrRoot | undefined>(undefined);
