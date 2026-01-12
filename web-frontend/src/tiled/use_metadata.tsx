import { useQuery } from "@tanstack/react-query";

import { getMetadata } from "./tiled_api";

export const useMetadata = (uid: string) => {
  const {isLoading, data} = useQuery({
    queryFn: async () => await getMetadata(uid),
    queryKey: ["metadata", uid],
  });
  return {data, isLoading};
};
