/**
 * 画像をアップロード前に圧縮する。
 * - HEIC は heic2any で JPEG に変換 (iPhone のデフォルト形式対応)
 * - 長辺 1600px にリサイズ
 * - JPEG / WebP は quality 0.82 に再エンコード
 * - 透過 PNG はそのまま (背景情報を保ちたいユーザー向け)
 */

const MAX_LONG_EDGE = 1600;
const JPEG_QUALITY = 0.82;

export interface CompressOptions {
  /** 出力 MIME (デフォルトは入力に応じて自動)。 */
  mime?: 'image/jpeg' | 'image/png' | 'image/webp';
  /** 長辺の最大サイズ (px)。デフォルト 1600。 */
  maxLongEdge?: number;
}

export async function compressImage(
  input: File | Blob,
  opts: CompressOptions = {},
): Promise<Blob> {
  let blob: Blob = input;

  // 1) HEIC → JPEG (動的 import で初回バンドルから外す)
  const inputType = (input as File).type || '';
  if (inputType === 'image/heic' || inputType === 'image/heif') {
    const { default: heic2any } = await import('heic2any');
    const converted = await heic2any({
      blob: input,
      toType: 'image/jpeg',
      quality: 0.9,
    });
    blob = Array.isArray(converted) ? converted[0] : (converted as Blob);
  }

  // 2) Canvas で長辺リサイズ + 再エンコード
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const maxEdge = opts.maxLongEdge ?? MAX_LONG_EDGE;
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');

    // 高品質なリサンプリングのため
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    // 出力 MIME 決定
    const outMime =
      opts.mime ??
      (blob.type === 'image/png' || blob.type === 'image/webp'
        ? (blob.type as 'image/png' | 'image/webp')
        : 'image/jpeg');

    const out = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
        outMime,
        JPEG_QUALITY,
      );
    });
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/** 当月の画像付き取引数を数える (無料プランの制限判定用)。 */
export function countImagesThisMonth(
  transactions: Array<{ imagePath?: string | null; date: number; type: string }>,
  now = Date.now(),
): number {
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  return transactions.filter(
    (t) => !!t.imagePath && t.date >= start && t.date < end,
  ).length;
}
