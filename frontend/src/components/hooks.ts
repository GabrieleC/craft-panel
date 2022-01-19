import { useCallback, useEffect, useState } from "react";

export function useFetch<T>(fetchData: () => Promise<T>): {
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
      try {
        setIsLoading(true);
        setError(false);
        const result = await fetchData();
        setData(result);
      } catch (error) {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshToken, fetchData]);

  return {
    data,
    error,
    isLoading,
    trigger: useCallback(() => {
      setRefreshToken(refreshToken + 1);
    }, [refreshToken]),
  };
}

export function useCall<T>(perform: () => Promise<T>) {
  const [error, setError] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  const call = async () => {
    try {
      setIsCalling(true);
      const result = await perform();
      return result;
    } catch (error) {
      setError(true);
      throw error;
    } finally {
      setIsCalling(false);
    }
  };

  return { isCalling, error, call };
}
