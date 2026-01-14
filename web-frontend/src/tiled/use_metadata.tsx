import { useQuery } from "@tanstack/react-query";

import { getMetadata } from "./tiled_api";

export const useMetadata = (uid?: string) => {
  const { isLoading, data } = useQuery({
    queryFn: async () => {
      if (uid == null) {
        return null;
      }
      return await getMetadata(uid);
    },
    queryKey: ["metadata", uid],
  });
  return { data, isLoading };
};
