import { NextRequest, NextResponse } from 'next/server';
import chromiumP from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const { searchParams, origin } = new URL(req.url);
    let targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new NextResponse('Missing "url" query param', { status: 400 });
    }

    // Garantir URL absoluta
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `${origin}${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
    }

    // Configurações recomendadas pelo @sparticuz/chromium para serverless
    // https://github.com/Sparticuz/chromium#puppeteer-core
    chromiumP.setHeadlessMode = true;
    chromiumP.setGraphicsMode = false;

    const executablePath = await chromiumP.executablePath();
    const browser = await puppeteer.launch({
      args: chromiumP.args,
      executablePath: executablePath || undefined,
      headless: chromiumP.headless,
      defaultViewport: { width: 1680, height: 1188 },
      env: { ...process.env, ...chromiumP.environment || {} },
    });

    try {

      const page = await browser.newPage();
      await page.emulateMediaType('screen');
      await page.setCacheEnabled(false);

      // Tamanho A4 landscape, deixar CSS decidir o tamanho com preferCSSPageSize
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 180000 });

      // Aguarda um marcador opcional de pronto da página imprimível, se existir
      await page.waitForSelector('body[data-print-ready="true"]', { timeout: 30000 }).catch(() => {});

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

      // Converter Buffer Node para ArrayBuffer puro — compatível com Blob/Fetch
      const arrayBuffer = pdfBuffer.buffer.slice(
        pdfBuffer.byteOffset,
        pdfBuffer.byteOffset + pdfBuffer.byteLength
      ) as ArrayBuffer;
      const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
      return new NextResponse(pdfBlob, { status: 200, headers });
    } finally {
      if (browser) await browser.close();
    }
  } catch (err: any) {
    console.error('Erro ao gerar PDF com Puppeteer:', err?.message || err);
    return NextResponse.json({ error: 'Erro ao gerar PDF', details: String(err?.message || err) }, { status: 500 });
  }
}


