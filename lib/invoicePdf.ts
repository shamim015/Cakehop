import { SHOP } from "./shop";
import { paymentName, tk, type Order } from "./order";

/**
 * Builds the invoice as a PDF file in the browser and downloads it.
 * No extra npm package needed: the invoice is drawn on a <canvas>, saved as a JPEG
 * and wrapped in a tiny PDF. Drawing it as an image means every font and language
 * (including Bangla names / addresses) looks exactly right.
 */

const W = 595; // A4 width in points
const MIN_H = 842; // A4 height; the page grows taller if there are many items
const M = 40; // page margin
const CW = W - M * 2; // content width
const SCALE = 3; // pixel density (3x = sharp when zoomed or printed)

const BRAND = "#FF5C93";
const INK = "#1F1B1D";
const GRAY = "#6B7280";
const TEXT = "#4B5563";
const LINE = "#F0F0F0";

const CAKE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256">
<defs>
<linearGradient id="b1" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#D93A74"/><stop offset=".3" stop-color="#FF6B9D"/><stop offset=".6" stop-color="#FF8FB5"/><stop offset="1" stop-color="#D93A74"/></linearGradient>
<linearGradient id="b2" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#E8467F"/><stop offset=".35" stop-color="#FF86AC"/><stop offset=".65" stop-color="#FFA7C4"/><stop offset="1" stop-color="#E8467F"/></linearGradient>
<radialGradient id="tp" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFD0E0"/></radialGradient>
<radialGradient id="ch" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FF8DAA"/><stop offset=".5" stop-color="#E91E63"/><stop offset="1" stop-color="#A5124A"/></radialGradient>
<linearGradient id="pl" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F2BFD1"/></linearGradient>
</defs>
<ellipse cx="32" cy="59" rx="27" ry="3" fill="#B0305F" opacity=".18"/>
<ellipse cx="32" cy="56" rx="30" ry="6" fill="url(#pl)"/>
<path d="M10 38v12a22 6 0 0 0 44 0V38Z" fill="url(#b1)"/>
<g fill="#FFE0EA"><rect x="12" y="38.5" width="4" height="8" rx="2"/><rect x="18" y="40" width="4" height="11" rx="2"/><rect x="24" y="40.8" width="4" height="7" rx="2"/><rect x="30" y="41" width="4" height="10" rx="2"/><rect x="36" y="40.8" width="4" height="8" rx="2"/><rect x="42" y="40" width="4" height="12" rx="2"/><rect x="48" y="38.5" width="4" height="8" rx="2"/></g>
<ellipse cx="32" cy="38" rx="22" ry="6" fill="url(#tp)"/>
<path d="M18 26v12a14 4 0 0 0 28 0V26Z" fill="url(#b2)"/>
<g fill="#FFE0EA"><rect x="22" y="26.3" width="4" height="7" rx="2"/><rect x="30" y="27" width="4" height="9" rx="2"/><rect x="38" y="26.3" width="4" height="7" rx="2"/></g>
<ellipse cx="32" cy="26" rx="14" ry="4" fill="url(#tp)"/>
<path d="M32 19.6q1-4.2 4.5-5" fill="none" stroke="#3FA34D" stroke-width="1.3" stroke-linecap="round"/>
<circle cx="32" cy="23" r="3.6" fill="url(#ch)"/>
<ellipse cx="30.8" cy="21.7" rx="1.1" ry=".7" fill="#fff" opacity=".8"/>
</svg>`;

type Fonts = { sans: string; serif: string; script: string };

function familyOf(cls: string, fallback: string): string {
  try {
    const el = document.createElement("span");
    el.className = cls;
    el.style.cssText = "position:absolute;visibility:hidden";
    document.body.appendChild(el);
    const fam = getComputedStyle(el).fontFamily;
    el.remove();
    return fam || fallback;
  } catch {
    return fallback;
  }
}

function loadLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(CAKE_SVG);
  });
}

/** Splits text into lines that fit maxW (also breaks very long words). */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of String(text).split(/\r?\n/)) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxW) {
        line = test;
        continue;
      }
      if (line) out.push(line);
      line = "";
      let chunk = "";
      for (const ch of Array.from(word)) {
        if (ctx.measureText(chunk + ch).width > maxW && chunk) {
          out.push(chunk);
          chunk = ch;
        } else chunk += ch;
      }
      line = chunk;
    }
    out.push(line);
  }
  return out;
}

/** Draws the whole invoice. With draw=false it only measures and returns the height used. */
function paint(ctx: CanvasRenderingContext2D, o: Order, f: Fonts, logo: HTMLImageElement | null, draw: boolean): number {
  const F = (weight: number, size: number, fam: string) => `${weight} ${size}px ${fam}`;
  const put = (s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = "left") => {
    if (!draw) return;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(s, x, y);
  };
  const rule = (y: number, color = LINE) => {
    if (!draw) return;
    ctx.fillStyle = color;
    ctx.fillRect(M, y, CW, 1);
  };
  const lines = (s: string, maxW: number, font: string) => {
    ctx.font = font;
    return wrap(ctx, s, maxW);
  };

  const date = new Date(o.createdAt).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  // ---- header
  let y = M;
  if (draw && logo) ctx.drawImage(logo, M, y, 46, 46);
  const scriptFont = F(700, 30, f.script);
  ctx.font = scriptFont;
  const cakeW = ctx.measureText("Cake").width;
  const fullW = ctx.measureText(SHOP.name).width;
  put("Cake", M + 52, y + 27, scriptFont, INK);
  put(SHOP.name.replace(/^Cake/, ""), M + 52 + cakeW, y + 27, scriptFont, BRAND);
  put("— Baked with Love —", M + 52 + fullW / 2, y + 40, F(400, 7.5, f.sans), TEXT, "center");
  put(`${SHOP.email} · WhatsApp ${SHOP.whatsappDisplay}`, M, y + 66, F(400, 8.5, f.sans), GRAY);

  put("INVOICE", W - M, y + 24, F(700, 22, f.serif), BRAND, "right");
  put(o.id, W - M, y + 42, F(700, 11, f.sans), INK, "right");
  put(date, W - M, y + 56, F(400, 8.5, f.sans), GRAY, "right");
  rule(y + 78);

  // ---- billed to / deliver to
  y += 78 + 24;
  const label = F(700, 7.5, f.sans);
  put("BILLED TO", M, y, label, GRAY);
  put(o.customer.name, M, y + 17, F(700, 10.5, f.sans), INK);
  let leftEnd = y + 17;
  put(o.customer.phone, M, y + 32, F(400, 10, f.sans), TEXT);
  leftEnd = y + 32;
  if (o.customer.email) {
    put(o.customer.email, M, y + 46, F(400, 10, f.sans), TEXT);
    leftEnd = y + 46;
  }

  const x2 = M + CW / 2 + 20;
  const col2 = CW / 2 - 20;
  put("DELIVER TO", x2, y, label, GRAY);
  let ry = y + 17;
  for (const l of lines(o.customer.address, col2, F(400, 10, f.sans))) {
    put(l, x2, ry, F(400, 10, f.sans), TEXT);
    ry += 13.5;
  }
  for (const l of lines(o.customer.city, col2, F(400, 10, f.sans))) {
    put(l, x2, ry, F(400, 10, f.sans), TEXT);
    ry += 13.5;
  }
  ry += 4;
  put("Payment:", x2, ry, F(400, 8.5, f.sans), GRAY);
  ctx.font = F(400, 8.5, f.sans);
  put(paymentName(o.payment), x2 + ctx.measureText("Payment: ").width, ry, F(700, 8.5, f.sans), INK);

  y = Math.max(leftEnd, ry) + 24;

  // ---- items table
  const itemX = M + 12;
  const itemW = 235;
  const qtyX = M + 285;
  const priceX = M + 400;
  const totalX = M + CW - 12;
  if (draw) {
    ctx.fillStyle = "#FFEEF3";
    ctx.fillRect(M, y, CW, 24);
  }
  const th = F(700, 8, f.sans);
  put("ITEM", itemX, y + 15, th, TEXT);
  put("QTY", qtyX, y + 15, th, TEXT, "center");
  put("PRICE", priceX, y + 15, th, TEXT, "right");
  put("TOTAL", totalX, y + 15, th, TEXT, "right");
  y += 24;

  for (const it of o.items) {
    const nameFont = F(700, 10.5, f.sans);
    const detFont = F(400, 8.5, f.sans);
    const nameLines = lines(it.name, itemW, nameFont);
    let ty = y + 17;
    for (const l of nameLines) {
      put(l, itemX, ty, nameFont, INK);
      ty += 14;
    }
    ty -= 14;
    for (const d of it.details ?? []) {
      for (const l of lines(d, itemW, detFont)) {
        ty += 11.5;
        put(l, itemX, ty, detFont, GRAY);
      }
    }
    put(String(it.qty), qtyX, y + 17, F(400, 10, f.sans), INK, "center");
    put(tk(it.price), priceX, y + 17, F(400, 10, f.sans), TEXT, "right");
    put(tk(it.price * it.qty), totalX, y + 17, F(700, 10, f.sans), INK, "right");
    y = ty + 12;
    rule(y);
  }

  // ---- totals
  y += 26;
  const tx = W - M - 210;
  const row = (l: string, v: string) => {
    put(l, tx, y, F(400, 10, f.sans), TEXT);
    put(v, W - M - 12, y, F(700, 10, f.sans), INK, "right");
    y += 21;
  };
  row("Subtotal", tk(o.subtotal));
  row("Delivery", o.delivery === 0 ? "Free" : tk(o.delivery));
  if (draw) {
    ctx.fillStyle = "#E5E7EB";
    ctx.fillRect(tx, y - 11, 210, 1);
  }
  y += 8;
  put("Total", tx, y, F(700, 12, f.sans), INK);
  put(tk(o.total), W - M - 12, y, F(700, 13, f.sans), BRAND, "right");
  y += 14;

  // ---- note
  if (o.customer.note) {
    y += 14;
    ctx.font = F(700, 9, f.sans);
    const nw = ctx.measureText("Note: ").width;
    const nl = lines(o.customer.note, CW - nw, F(400, 9, f.sans));
    put("Note:", M, y, F(700, 9, f.sans), TEXT);
    nl.forEach((l, i) => {
      put(l, M + nw, y + i * 12, F(400, 9, f.sans), TEXT);
    });
    y += (nl.length - 1) * 12 + 6;
  }

  // ---- footer
  y += 34;
  rule(y);
  put("Status: Pending confirmation. We will confirm your order on WhatsApp shortly.", W / 2, y + 22, F(400, 8.5, f.sans), GRAY, "center");
  put(`Thank you for choosing ${SHOP.name}!`, W / 2, y + 36, F(400, 8.5, f.sans), GRAY, "center");
  return y + 36;
}

/** Wraps one JPEG image into a single-page PDF. */
export function jpegToPdf(jpeg: Uint8Array, wPx: number, hPx: number, wPt: number, hPt: number): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let len = 0;
  const push = (d: string | Uint8Array) => {
    const b = typeof d === "string" ? enc.encode(d) : d;
    chunks.push(b);
    len += b.length;
  };
  const begin = (n: number) => {
    offsets[n] = len;
    push(`${n} 0 obj\n`);
  };

  push("%PDF-1.4\n");
  begin(1);
  push("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  begin(2);
  push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  begin(3);
  push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt} ${hPt}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
  begin(4);
  push(`<< /Type /XObject /Subtype /Image /Width ${wPx} /Height ${hPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  push(jpeg);
  push("\nendstream\nendobj\n");
  const content = `q ${wPt} 0 0 ${hPt} 0 0 cm /Im0 Do Q`;
  begin(5);
  push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);

  const xref = len;
  let table = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) table += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  push(table);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);

  const out = new Uint8Array(len);
  let p = 0;
  for (const c of chunks) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

/** Creates the invoice PDF for this order and downloads it as Invoice-<order id>.pdf */
export async function downloadInvoicePdf(order: Order): Promise<void> {
  const fonts: Fonts = {
    sans: familyOf("font-sans", "Arial, sans-serif"),
    serif: familyOf("font-serif", "Georgia, serif"),
    script: familyOf("font-script", "cursive"),
  };
  try {
    await Promise.all([
      document.fonts.load(`400 12px ${fonts.sans}`),
      document.fonts.load(`700 12px ${fonts.sans}`),
      document.fonts.load(`700 30px ${fonts.script}`),
      document.fonts.load(`700 22px ${fonts.serif}`),
    ]);
  } catch {}
  const logo = await loadLogo();

  // 1st pass: measure how tall the page must be
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) throw new Error("Canvas is not supported");
  const usedH = paint(probe, order, fonts, logo, false);
  const H = Math.max(MIN_H, Math.ceil(usedH + M));

  // 2nd pass: draw for real
  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);
  paint(ctx, order, fonts, logo, true);

  const jpeg: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create image"))), "image/jpeg", 0.92)
  );
  const pdf = jpegToPdf(new Uint8Array(await jpeg.arrayBuffer()), canvas.width, canvas.height, W, H);

  const url = URL.createObjectURL(new Blob([pdf.buffer as ArrayBuffer], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-${order.id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
