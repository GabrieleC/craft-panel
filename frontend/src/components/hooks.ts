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
          const result = await fetchData();
          setData(result);
          setIsLoading(false);
        } catch (error) {
          setIsLoading(false);
          setError(true);
        }
      }
    })();
  }, [refreshToken, delayed, fetchData]);

  return {
    data,
    error,
    isLoading,
    trigger: () => {
      setRefreshToken(refreshToken + 1);
    },
  };
}

export function useCall<T>(perform: () => T | Error) {
  const [error, setError] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  const call = async () => {
    try {
      setIsCalling(true);
      const result = await perform();
      setIsCalling(false);
      return result;
    } catch (error) {
      setError(true);
      setIsCalling(false);
      throw error;
    }
  };

  return { isCalling, error, call };
}
