import type { ReactElement } from "react";

import { OphydContext } from "./context";

export const OphydProvider = ({
  uri,
  children,
}: {
  uri: string;
  children: ReactElement[];
}) => {
  return <OphydContext value={uri}>{children}</OphydContext>;
};
