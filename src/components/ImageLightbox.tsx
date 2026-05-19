import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getSignedReceiptUrl } from '../lib/storage';

interface Props {
  /** Supabase Storage 上のパス。null なら閉じている。 */
  path: string | null;
  onClose: () => void;
}

export function ImageLightbox({ path, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getSignedReceiptUrl(path).then((u) => {
      if (cancelled) return;
      if (!u) setError('画像を読み込めませんでした');
      setUrl(u);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  useEffect(() => {
    if (!path) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [path, onClose]);

  if (!path) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="画像プレビュー"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="閉じる"
        className="tap-shrink absolute top-4 right-4 size-10 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center"
      >
        <X size={18} />
      </button>

      {loading && (
        <div className="text-white/80 text-[0.875rem]">読み込み中…</div>
      )}
      {error && (
        <div className="text-rose-300 text-[0.875rem] px-6 text-center">
          {error}
        </div>
      )}
      {url && !loading && !error && (
        <img
          src={url}
          alt="レシート"
          className="max-w-[92vw] max-h-[92vh] object-contain rounded-lg shadow-2xl animate-pop-in"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
