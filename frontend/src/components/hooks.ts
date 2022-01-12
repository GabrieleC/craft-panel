import { useEffect, useState } from "react";

export function useFetch<T>(
  fetchData: () => Promise<T>,
  delayed: boolean = false
): {
  data: T | null;
  error: boolean;
  isLoading: boolean;
  trigger: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    (async () => {
      if (!delayed || refreshToken > 0) {
        try {
          setIsLoading(true);
          setError(false);
          setData(await fetchData());
          setIsLoading(false);
        } catch (error) {
          setIsLoading(false);
          setError(true);
        }
      }
    })();
  }, [refreshToken, delayed]);

  return {
    data,
    error,
    isLoading,
    trigger: () => {
      setRefreshToken(refreshToken + 1);
    },
  };
}
