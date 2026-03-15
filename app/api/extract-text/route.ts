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
      // PDF extraction
      // Use lib path directly — avoids pdf-parse running test code on require in Next.js
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      const result = await pdfParse(buffer);
      text = result.text;
    } else if (
      filename.endsWith('.pptx') ||
      filename.endsWith('.ppt') ||
      filename.endsWith('.docx') ||
      filename.endsWith('.doc')
    ) {
      // Office format extraction
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

    return NextResponse.json({ success: true, text, filename: file.name });
  } catch (err) {
    console.error('Text extraction error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to extract text from file. Try pasting the content manually.' },
      { status: 500 }
    );
  }
}
