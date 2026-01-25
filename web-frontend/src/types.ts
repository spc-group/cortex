import { ReadyState } from "react-use-websocket";

export interface SearchParams {
  pageOffset?: number;
  pageLimit?: number;
  filters?: { [key: string]: string };
  sortField?: string;
  searchText?: string;
  standardsOnly?: boolean;
}

export interface webSocketMessage {
  lastMessage: { data: Blob };
  readyState: ReadyState;
}
