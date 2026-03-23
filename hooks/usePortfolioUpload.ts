import { useState } from 'react';

/**
 * Hook for recording portfolio uploads to database
 */
export function usePortfolioUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordUpload = async (uploadData: {
    portfolio_name: string;
    template_type: string;
    file_url: string;
    file_size?: number;
    metadata?: any;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/portfolio/upload-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
      });

      if (!response.ok) {
        throw new Error('Failed to record upload');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { recordUpload, loading, error };
}
