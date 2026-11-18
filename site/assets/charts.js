// رسوم بيانية SVG خفيفة بلا مكتبات: عدّاد، حلقة، رادار، أشرطة مكدّسة. ألوان الجودة: قوة / متوسط / فجوة
const CH = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const tone = (m) => m == null ? "#b7c9cd" : m >= 3.3 ? "#2e9e6b" : m >= 2.8 ? "#18a4ab" : m >= 2.4 ? "#e3a93c" : "#d9534f";
  const SCALE = ["#d9534f", "#eb9a4b", "#5bb7bd", "#2e9e6b"];   // من الأضعف إلى الأقوى (1..4)
  // عدّاد نصف دائري لمتوسط من 4
  const gauge = (v, max = 4) => { const p = v == null ? 0 : Math.max(0, Math.min(1, v / max)), R = 80, C = Math.PI * R, c = tone(v);
    return `<svg class="ch-g" viewBox="0 0 200 118" role="img" aria-label="المتوسط العام ${v ?? "غير متاح"} من ${max}"><path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="#e3eef0" stroke-width="16" stroke-linecap="round"/>
      <path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="${c}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="--to:${C * (1 - p)};animation:chDraw 1.1s .1s forwards"/>
      <text x="100" y="88" text-anchor="middle" class="ch-gv" fill="${c}">${v ?? "—"}</text><text x="100" y="110" text-anchor="middle" class="ch-gl">من ${max}</text></svg>`; };
  // حلقة تقدّم (المشاركون من المستهدف)
  const ring = (n, total, label) => { const p = total ? Math.min(1, n / total) : (n ? 1 : 0), R = 52, C = 2 * Math.PI * R;
    return `<svg class="ch-r" viewBox="0 0 140 140" role="img" aria-label="${esc(label)}"><circle cx="70" cy="70" r="${R}" fill="none" stroke="#e3eef0" stroke-width="14"/><circle cx="70" cy="70" r="${R}" fill="none" stroke="${p >= 1 ? "#2e9e6b" : "#18a4ab"}" stroke-width="14" stroke-linecap="round" transform="rotate(-90 70 70)" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="--to:${C * (1 - p)};animation:chDraw 1.1s .1s forwards"/>
      <text x="70" y="68" text-anchor="middle" class="ch-gv" style="font-size:26px">${total ? Math.round(p * 100) + "%" : n}</text><text x="70" y="90" text-anchor="middle" class="ch-gl">${esc(label)}</text></svg>`; };
  // رادار للمحاور (٣ فأكثر)، وإلا أشرطة
  const radar = (d, max = 4) => { const n = d.length; if (n < 3) return bars(d.map((x) => [x.name, x.mean, x.mean + " من " + max]), max);
    const cx = 150, cy = 140, R = 90, pt = (i, v) => { const a = -Math.PI / 2 + 2 * Math.PI * i / n; return [cx + R * v / max * Math.cos(a), cy + R * v / max * Math.sin(a)]; };
    const ring_ = (v) => d.map((_, i) => pt(i, v).map((z) => z.toFixed(1)).join(",")).join(" ");
    const poly = d.map((x, i) => pt(i, Number(x.mean) || 0).map((z) => z.toFixed(1)).join(",")).join(" ");
    return `<svg class="ch-rad" viewBox="0 0 300 285" role="img" aria-label="رادار المحاور">${[1, 2, 3, 4].map((v) => `<polygon points="${ring_(v)}" fill="none" stroke="#dcebee"/>`).join("")}
      ${d.map((_, i) => { const [x, y] = pt(i, max); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#dcebee"/>`; }).join("")}
      <polygon class="ch-poly" points="${poly}" fill="#18a4ab33" stroke="#0c6f82" stroke-width="2.5" stroke-linejoin="round"/>
      ${d.map((x, i) => { const [px, py] = pt(i, Number(x.mean) || 0), [lx, ly] = pt(i, max + .55); return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5" fill="${tone(x.mean)}" stroke="#fff" stroke-width="2"><title>${esc(x.name)}: ${x.mean}</title></circle><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" class="ch-lb">${esc(x.name)}</text>`; }).join("")}</svg>`; };
  // أشرطة أفقية: rows = [label, value, text]
  const bars = (rows, max = 100) => `<div class="ch-b">${rows.map(([l, v, t, c], i) => `<div class="ch-br" style="animation-delay:${i * 50}ms"><span class="ch-bl">${esc(l)}</span><span class="ch-bt"><i style="width:${Math.max(0, Math.min(100, 100 * v / max))}%;background:${c || tone(max === 4 ? v : null) || "#18a4ab"}"></i></span><b>${esc(t)}</b></div>`).join("")}</div>`;
  // شريط مكدّس لتوزيع الإجابات (٤ مستويات) مع تفاصيل عند المرور
  const stack = (dist, opts, n) => { const t = dist.reduce((a, b) => a + b, 0);
    return `<div class="ch-s" role="img" aria-label="توزيع الإجابات">${dist.map((c, k) => t ? `<span style="flex:${c};background:${SCALE[k]}" title="${esc((opts && opts[k]) || k + 1)}: ${c} (${Math.round(100 * c / t)}%)">${c / t >= .12 ? Math.round(100 * c / t) + "%" : ""}</span>` : "").join("") || '<span class="ch-e">لا إجابات بعد</span>'}</div>
      <div class="ch-lg">${dist.map((c, k) => `<span><i style="background:${SCALE[k]}"></i>${esc((opts && opts[k]) || k + 1)} <b>${c}</b></span>`).join("")}</div>`; };
  const donut = (rows) => { const t = rows.reduce((a, r) => a + r.count, 0), R = 40, C = 2 * Math.PI * R; let off = 0; const P = ["#0c6f82", "#18a4ab", "#e3a93c", "#d9534f", "#7a6bbf", "#2e9e6b", "#8aa0a6"];
    return `<div class="ch-d"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="${R}" fill="none" stroke="#e3eef0" stroke-width="16"/>${t ? rows.map((r, i) => { const l = C * r.count / t, s = `<circle cx="50" cy="50" r="${R}" fill="none" stroke="${P[i % 7]}" stroke-width="16" stroke-dasharray="${l} ${C - l}" stroke-dashoffset="${-off}" transform="rotate(-90 50 50)"><title>${esc(r.label)}: ${r.count}</title></circle>`; off += l; return s; }).join("") : ""}</svg>
      <div class="ch-lg col">${rows.map((r, i) => `<span><i style="background:${P[i % 7]}"></i>${esc(r.label)} <b>${r.count} (${r.pct}%)</b></span>`).join("")}</div></div>`; };
  return { gauge, ring, radar, bars, stack, donut, tone, esc };
})();
