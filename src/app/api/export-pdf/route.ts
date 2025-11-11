import { NextRequest, NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new NextResponse('Missing "url" query param', { status: 400 });
    }

    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath || undefined,
      headless: chromium.headless,
      defaultViewport: { width: 1680, height: 1188 },
    });

    try {
      const page = await browser.newPage();

      // Tamanho A4 landscape, deixar CSS decidir o tamanho com preferCSSPageSize
      await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 120000 });

      // Aguarda um marcador opcional de pronto da página imprimível, se existir
      await page.waitForSelector('body[data-print-ready="true"]', { timeout: 10000 }).catch(() => {});

      const pdfBuffer = await page.pdf({
        printBackground: true,
        landscape: true,
        preferCSSPageSize: true,
        format: 'A4',
        margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
      });

      const headers = new Headers();
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', `attachment; filename="apresentacao.pdf"`);

      return new NextResponse(pdfBuffer, { status: 200, headers });
    } finally {
      await browser.close();
    }
  } catch (err: any) {
    console.error('Erro ao gerar PDF com Puppeteer:', err);
    return new NextResponse('Erro ao gerar PDF', { status: 500 });
  }
}


