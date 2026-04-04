import { resizeImageFileToJpegBase64 } from "./receiptImage";

export type OcrProgress = {
  /** 0–100 while work is in progress */
  percent: number;
  status: string;
};

/**
 * Run Tesseract.js in the browser on a resized JPEG (smaller = faster).
 * Loads WASM/worker on first use (dynamic import keeps the main bundle smaller).
 */
export async function ocrReceiptImageToText(
  file: File,
  onProgress?: (p: OcrProgress) => void
): Promise<string> {
  const { createWorker, PSM, OEM } = await import("tesseract.js");
  const { base64 } = await resizeImageFileToJpegBase64(file);
  const dataUrl = `data:image/jpeg;base64,${base64}`;

  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    logger: (m: { status: string; progress?: number }) => {
      if (typeof m.progress === "number") {
        onProgress?.({
          percent: Math.round(m.progress * 100),
          status: m.status,
        });
      } else {
        onProgress?.({ percent: 0, status: m.status });
      }
    },
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    });
    const {
      data: { text },
    } = await worker.recognize(dataUrl);
    return text;
  } finally {
    await worker.terminate();
  }
}
