import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.toLowerCase();
    let text = '';

    if (filename.endsWith('.pdf')) {
      text = await extractPdf(buffer);
    } else if (
      filename.endsWith('.pptx') ||
      filename.endsWith('.ppt') ||
      filename.endsWith('.docx') ||
      filename.endsWith('.doc')
    ) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const officeParser = require('officeparser');
      text = await officeParser.parseOfficeAsync(buffer);
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Upload a PDF, PPTX, or DOCX.' },
        { status: 400 }
      );
    }

    // Clean up extracted text
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!text || text.length < 20) {
      return NextResponse.json(
        { success: false, error: 'No readable text found in file. It may be a scanned image PDF — try copying text manually.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, text, filename: file.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Text extraction error:', message);
    return NextResponse.json(
      { success: false, error: `Extraction failed: ${message}` },
      { status: 500 }
    );
  }
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // Try unpdf first (PDF.js based, best for Next.js)
  try {
    const { extractText, getDocumentProxy } = await import('unpdf');
    const uint8 = new Uint8Array(buffer);
    const pdf = await getDocumentProxy(uint8);
    const { text } = await extractText(pdf, { mergePages: true });
    if (text && text.length > 20) return text;
  } catch (e) {
    console.warn('unpdf failed, trying fallback:', e instanceof Error ? e.message : e);
  }

  // Fallback: pdf-parse lib (bypasses the broken require wrapper)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');
    const result = await pdfParse(buffer);
    if (result.text && result.text.length > 20) return result.text;
  } catch (e) {
    console.warn('pdf-parse fallback failed:', e instanceof Error ? e.message : e);
  }

  throw new Error('Could not extract text from PDF. It may be a scanned/image-only PDF.');
}
