import { useEffect, useState } from "react";
import { listServers, ServerDTO } from "../services/server";
import { listVersions } from "../services/repo";

export function useVersions(): [string[] | null, boolean] {
  const [versions, setVersions] = useState<string[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setError(false);
        setVersions(await listVersions());
      } catch (error) {
        setError(true);
      }
    })();
  }, []);

  return [versions, error];
}

export function useListServers(refresh: number): [ServerDTO[] | null, boolean] {
  const [servers, setServers] = useState<ServerDTO[] | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setServers(null);
    (async () => {
      try {
        setServers(await listServers());
        setError(false);
      } catch (error) {
        setError(true);
      }
    })();
  }, [refresh]);

  return [servers, error];
}
