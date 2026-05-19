/**
 * PDF レポート生成ユーティリティ。
 *
 * - jsPDF + html2canvas を動的 import で遅延ロードし、初回バンドルに影響させない。
 * - 与えられた DOM ノードを画像化して PDF に貼り付ける方式。
 *   日本語フォント埋め込み不要、CSS スタイルそのままレンダリングされる。
 */

interface GenerateOptions {
  /** PDF 化する DOM ノード。可視・不可視どちらでも可。 */
  node: HTMLElement;
  /** 保存時のファイル名 (例: "worthit-2026-05.pdf")。 */
  filename: string;
  /** 余白 (mm)。デフォルト 12。 */
  marginMm?: number;
}

export async function generatePdfFromNode({
  node,
  filename,
  marginMm = 12,
}: GenerateOptions): Promise<void> {
  // 重いライブラリは必要になった瞬間にだけロードする
  const [{ default: jsPDF }, html2canvas] = await Promise.all([
    import('jspdf'),
    import('html2canvas').then((m) => m.default),
  ]);

  // 高解像度キャプチャ (×2)。スマホでぼやけない。
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');

  // A4 縦 = 210mm × 297mm
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const usableW = pageW - marginMm * 2;

  // キャンバスの実寸を usableW にフィットさせる
  const imgWmm = usableW;
  const imgHmm = (canvas.height / canvas.width) * imgWmm;

  if (imgHmm <= pageH - marginMm * 2) {
    // 1 ページに収まる
    pdf.addImage(imgData, 'PNG', marginMm, marginMm, imgWmm, imgHmm);
  } else {
    // 高さがオーバーする場合、画像を縦に分割
    const pageContentH = pageH - marginMm * 2;
    // mm 単位での描画累積位置
    let drawn = 0;
    while (drawn < imgHmm) {
      const remaining = imgHmm - drawn;
      const sliceH = Math.min(pageContentH, remaining);

      // 元キャンバスから対応する縦範囲だけ切り出して描く
      const sliceCanvas = document.createElement('canvas');
      const ratio = canvas.width / imgWmm; // px per mm
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.floor(sliceH * ratio);
      const ctx = sliceCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D context for slicing');
      ctx.drawImage(
        canvas,
        0,
        Math.floor(drawn * ratio),
        canvas.width,
        sliceCanvas.height,
        0,
        0,
        canvas.width,
        sliceCanvas.height,
      );
      const sliceData = sliceCanvas.toDataURL('image/png');

      if (drawn > 0) pdf.addPage();
      pdf.addImage(sliceData, 'PNG', marginMm, marginMm, imgWmm, sliceH);
      drawn += sliceH;
    }
  }

  pdf.save(filename);
}
