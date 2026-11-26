// Shared pictures for the BOTS and STATS pages (needs esc, money, signed from the page).
const COLORS = { pink: "#ff3ea5", cyan: "#2de2e6", yellow: "#ffd319", purple: "#a259ff", green: "#39ff88", orange: "#ff9a3c", blue: "#4d9bff", lime: "#c6ff3d", white: "#f2f2f7", red: "#ff4d5e", teal: "#00e5c0", rose: "#ff8fc8", ice: "#b8f2ff" };
// ---------- pictures ----------
function lineChart(series, h = 200) {
  // series: [{curve:[...], color:"#hex", name}]
  const W = 600, H = h, P = 30;
  const all = series.flatMap(s => s.curve).concat([0]);
  const lo = Math.min(...all), hi = Math.max(...all), span = (hi - lo) || 1;
  const maxLen = Math.max(...series.map(s => s.curve.length), 2);
  const x = i => P + i / (maxLen - 1) * (W - 2 * P), y = v => H - P - (v - lo) / span * (H - 2 * P);
  const lines = series.filter(s => s.curve.length >= 1).map(s => {
    const pts = (s.curve.length === 1 ? [0, s.curve[0]] : [0, ...s.curve]).map((v, i) => `${x(i * (maxLen - 1) / Math.max(s.curve.length, 1)).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const end = s.curve[s.curve.length - 1];
    return `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
      <circle cx="${(W - P).toFixed(1)}" cy="${y(end).toFixed(1)}" r="5" fill="${s.color}"/>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="profit over time">
    <line x1="${P}" x2="${W - P}" y1="${y(0)}" y2="${y(0)}" stroke="#9d8cc9" stroke-dasharray="6 6"/>
    <text x="${P}" y="${y(0) - 6}" fill="#9d8cc9" font-size="18">$0 = break even</text>
    <text x="${P}" y="${H - 6}" fill="#9d8cc9" font-size="16">first bet</text>
    <text x="${W - P}" y="${H - 6}" fill="#9d8cc9" font-size="16" text-anchor="end">now</text>
    <text x="${W - P}" y="${P - 10}" fill="#9d8cc9" font-size="16" text-anchor="end">top: ${money(hi)}</text>
    ${lines}</svg>`;
}

function meter(t, luck) {
  if (!t.bets) return `<p class="m">Shows up once bets finish.</p>`;
  const lo = Math.max(0, t.expected - luck), hi = t.expected + luck;
  const max = Math.max(hi, t.wins, 1) * 1.15, min = Math.max(0, Math.min(lo, t.wins) * 0.85);
  const X = v => ((v - min) / (max - min || 1) * 100).toFixed(1) + "%";
  const c = t.wins > hi ? "var(--good)" : t.wins < lo ? "var(--bad)" : "var(--cyan)";
  return `<div class="bigmeter">
      <div class="bar"></div>
      <div class="zone" style="left:${X(lo)};width:calc(${X(hi)} - ${X(lo)})"></div>
      <div class="mk" style="left:${X(t.expected)};background:var(--yellow)"></div>
      <div class="lab y" style="left:${X(t.expected)};top:-14px">Kalshi expected ${t.expected}</div>
      <div class="mk" style="left:${X(t.wins)};background:${c};box-shadow:0 0 12px ${c}"></div>
      <div class="lab" style="left:${X(t.wins)};top:54px;color:${c}">actually won ${t.wins}</div>
    </div>
    <p class="hint" style="margin-top:18px">${t.wins > hi ? "&#128994; Past the luck zone on the right: beating Kalshi by more than luck." :
      t.wins < lo ? "&#128308; Left of the luck zone: doing worse than Kalshi's prices." :
      "&#128993; Inside the yellow luck zone: can't tell it apart from luck yet. Needs to get past the right edge."}</p>`;
}

function stripVis(strip, total) {
  // One square per bet. Squares shrink as bets pile up; past 300 only the newest are shown.
  if (!strip.length) return `<p class="m">No bets yet.</p>`;
  total = total || strip.length;
  const size = strip.length > 150 ? "xs" : strip.length > 60 ? "sm" : "";
  const won = strip.filter(s => s === "won").length, lost = strip.filter(s => s === "lost").length;
  return `${total > strip.length ? `<p class="hint">Showing the newest ${strip.length} of ${total} bets.</p>` : ""}
    <div class="strip ${size}">${strip.map(s => `<i class="${s}" title="${s}"></i>`).join("")}</div>
    <p class="hint" style="margin:8px 0 0">In these squares: <span class="pos">${won} won</span>, <span class="neg">${lost} lost</span>${won + lost ? ` (${Math.round(won / (won + lost) * 100)}% won)` : ""}.</p>
    <div class="race-legend"><span><i style="background:var(--good);height:12px;width:12px"></i>won</span>
      <span><i style="background:var(--bad);height:12px;width:12px"></i>lost</span>
      <span><i style="border:2px solid var(--yellow);height:12px;width:12px;background:none"></i>still going</span></div>`;
}

function marketBars(rows) {
  if (!rows.length) return `<p class="m">Shows up once bets finish.</p>`;
  const most = Math.max(...rows.map(r => r.bets));
  return rows.slice(0, 11).map(r => `<div class="mbar"><span>${esc(r.name)}</span>
      <div class="track" style="width:${(r.bets / most * 100).toFixed(0)}%"><span style="width:${(r.wins / r.bets * 100).toFixed(0)}%;background:var(--good)"></span><span style="width:${(100 - r.wins / r.bets * 100).toFixed(0)}%;background:var(--bad)"></span></div>
      <span class="n" style="text-align:right">${signed(r.pnl)}</span></div>`).join("") +
    `<p class="hint" style="margin-top:8px">Bar length = how many bets. Green part = won, red part = lost.</p>`;
}

function visuals(bot) {
  const col = COLORS[bot.color] || "#fff";
  return `<div class="vis">
    <div class="vbox wide"><h3>&#128200; PRETEND PROFIT OVER TIME</h3><p class="hint">Going up = making money. Each step is one finished bet.</p>
      ${bot.curve.length ? lineChart([{ curve: bot.curve, color: (bot.curve[bot.curve.length - 1] >= 0 ? "#39ff88" : "#ff4d6d") }]) : `<p class="m">Shows up once bets finish.</p>`}</div>
    <div class="vbox"><h3>&#127919; IS IT BEATING KALSHI?</h3><p class="hint">The yellow zone is normal luck. A good bot's marker ends up past its right edge.</p>${meter(bot.totals, bot.luck)}</div>
    <div class="vbox"><h3>&#129513; EVERY BET, OLDEST TO NEWEST</h3><p class="hint">One square per bet.</p>${stripVis(bot.strip, bot.strip_total)}</div>
    <div class="vbox wide"><h3>&#128506; WHERE IT BETS</h3>${marketBars(bot.by_market)}</div>
    ${bot.follow ? `<div class="vbox wide"><h3>&#128279; HOW OFTEN DO THE OTHERS REALLY FOLLOW BITCOIN?</h3>
      <p class="hint">Every 15-minute window we've seen: did each coin end UP/DOWN the same way Bitcoin did?</p>${followVis(bot.follow)}</div>` : ""}
  </div>`;
}

function followVis(f) {
  // How often each coin ended the same way as Bitcoin, per 15-minute window
  if (!f || !f.coins.some(c => c.windows)) return `<p class="m">Shows up once some 15-minute windows finish.</p>`;
  return f.coins.map(c => `<div class="mbar"><span>${esc(c.coin)}</span>
      <div class="track" style="width:100%"><span style="width:${c.pct ?? 0}%;background:var(--good)"></span><span style="width:${100 - (c.pct ?? 0)}%;background:var(--bad)"></span></div>
      <span class="n" style="text-align:right"><b class="y">${c.pct ?? "-"}%</b></span></div>
      <p class="hint fhint">${c.same} of ${c.windows} windows. When Bitcoin went UP: ${c.up_pct ?? "-"}% followed. When it went DOWN: ${c.down_pct ?? "-"}% followed.</p>`).join("") +
    `<p style="margin:8px 0 0">All 4 coins ended the same way in <b class="y">${f.all4_same} of ${f.all4_windows}</b> windows${f.all4_windows ? ` (${Math.round(f.all4_same / f.all4_windows * 100)}%)` : ""}.</p>
    <p class="hint" style="margin-top:6px">Green = ended the same way as Bitcoin. Red = went the other way. Catch: Kalshi's traders know this too, so the other coins' prices usually move with Bitcoin's. The bot only wins if it guesses Bitcoin's direction right <i>and</i> the others are still cheap.</p>`;
}

function raceChart(bots) {
  const withData = bots.filter(b => b.curve.length);
  return `<div class="vbox wide" style="margin-top:14px"><h3>&#127937; THE RACE: PRETEND PROFIT OVER TIME</h3>
    <p class="hint">Each line is one bot. Higher = more pretend profit. Lines are stretched so bots with fewer bets still fit.</p>
    ${withData.length ? lineChart(withData.map(b => ({ curve: b.curve, color: COLORS[b.color] })), 240) : `<p class="m">Shows up once bets finish.</p>`}
    <div class="race-legend">${bots.map(b => `<span><i style="background:${COLORS[b.color]}"></i>${esc(b.name)}</span>`).join("")}</div></div>`;
}


// Groups of similar bots, shared by the BOTS page tabs and the HOME page graph.
// A new bot not listed here lands in "Other ideas" until it's added to a group.
// Colors were checked for the dark page, colorblind eyes included.
const BOT_GROUPS = [
  { id: "all", name: "ALL BOTS", note: "every bot" },
  { id: "math", name: "GAP MATH", note: "math vs Kalshi's price", color: "#1f9ea3",
    ids: ["main", "math4c-first-look", "math4c-second-look", "hourly-math4c", "math4c-first-look-cap2",
          "fx-15m", "math4c-every-minute-cap2", "math4c-every-5s-fx-cap2"] },
  { id: "candle", name: "CANDLE RULE", note: "Bot H's resistance rule", color: "#d95926",
    ids: ["resistance-candle", "resistance-candle-exit30", "resistance-candle-jpy-eur"] },
  { id: "other", name: "OTHER IDEAS", note: "follow-Bitcoin, the Apprentice", color: "#9a6ce8" },
];
const botGroupOf = id => (BOT_GROUPS.find(g => g.ids && g.ids.includes(id)) || BOT_GROUPS[3]).id;
