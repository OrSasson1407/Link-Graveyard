import { useState, useEffect, useCallback } from 'react';
import { linksApi } from '../services/apiClient';

export const useLinks = (params?: { status?: string; page?: number; limit?: number; category?: string }) => {
  const [links, setLinks] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await linksApi.getAll(params);
      setLinks(response.data || []);
      setMeta(response.meta || null);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to fetch links');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return { links, meta, loading, error, refetch: fetchLinks };
};

export const useCreateLink = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLink = async (url: string, contextText?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await linksApi.create(url, contextText);
      return result;
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to create link';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createLink, loading, error };
};
