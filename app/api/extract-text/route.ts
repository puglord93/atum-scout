import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mode = formData.get('mode') as string | null; // 'text' or 'vision'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.toLowerCase();

    let text = '';

    if (mode === 'vision' && filename.endsWith('.pdf')) {
      // AI Vision mode: send PDF directly to GPT-4o via Responses API
      text = await extractWithVision(buffer, file.name);
    } else if (filename.endsWith('.pdf')) {
      // Standard text extraction
      text = await extractPdf(buffer);
    } else if (
      filename.endsWith('.pptx') || filename.endsWith('.ppt') ||
      filename.endsWith('.docx') || filename.endsWith('.doc')
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

    // Clean up
    text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    if (!text || text.length < 20) {
      return NextResponse.json(
        { success: false, error: 'No readable text found. The file may be a scanned image — try pasting content manually.' },
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

async function extractWithVision(buffer: Buffer, filename: string): Promise<string> {
  const base64 = buffer.toString('base64');
  // Use OpenAI Responses API which natively supports PDF input
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (openai.responses.create as (params: any) => Promise<any>)({
    model: 'gpt-4o',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_file',
            filename,
            file_data: `data:application/pdf;base64,${base64}`,
          },
          {
            type: 'input_text',
            text: `You are analyzing a research/technology deck or document for venture analysis purposes. Extract ALL content comprehensively:

1. All text exactly as written (titles, headings, body text, bullet points, captions, labels, numbers)
2. For each diagram/flowchart: describe what it shows, list each node/step, describe the connections and direction of arrows
3. For each chart/graph: describe what data it shows, key metrics, axis labels, trends
4. For tables: include headers and key data rows
5. For images: describe what they depict and their relevance
6. Preserve the structure slide-by-slide or section-by-section, labeling each clearly (e.g. "SLIDE 1:", "SLIDE 2:")

Be thorough — this extraction will be used to analyze the venture potential of this technology. Missing diagrams or process flows would result in incomplete analysis.`,
          },
        ],
      },
    ],
  });

  return response.output_text ?? '';
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // Try unpdf first (PDF.js based, designed for Next.js/serverless)
  try {
    const { extractText, getDocumentProxy } = await import('unpdf');
    const uint8 = new Uint8Array(buffer);
    const pdf = await getDocumentProxy(uint8);
    const { text } = await extractText(pdf, { mergePages: true });
    if (text && text.length > 20) return text;
  } catch (e) {
    console.warn('unpdf failed, trying fallback:', e instanceof Error ? e.message : e);
  }

  throw new Error('Could not extract text from PDF. It may be a scanned/image-only file.');
}
