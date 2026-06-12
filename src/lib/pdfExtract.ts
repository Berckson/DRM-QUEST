import * as pdfjsLib from 'pdfjs-dist';
// Vite-friendly worker import
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const MAX_PAGES = 4;
const MAX_CHARS = 8000;

/**
 * Extracts text from the first pages of a PDF, capping the size to avoid
 * blowing up the LLM token budget.
 */
export async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageCount = Math.min(pdf.numPages, MAX_PAGES);
  let text = '';

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    text += pageText + '\n\n';
    if (text.length >= MAX_CHARS) break;
  }

  return text.slice(0, MAX_CHARS).trim();
}
