import type { DeckManifest, DeckSlide, DeckChapter } from "./types";

// Visual system and navigation JS are adapted from deck-example-tradeform.html
// per Chris's request to borrow that deck's structure and interaction model.
// Chapter colors cycle through this palette (TradeForm hand-picked per
// chapter; we don't know the chapter list ahead of time, so we cycle).
const PALETTE = ["#57A8EE", "#F97316", "#8B5CF6", "#22C55E", "#EAB308", "#EC4899", "#14B8A6"];

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// slideIdx is -1 for the cover (not addressable by the revise flow; it's
// synthesized from manifest fields, not a stored DeckChapter slide) and the
// slide's own index within its chapter's slides[] array otherwise. Combined
// with chapterIndex, this is how the in-app editable preview tells the
// parent window which exact manifest slide is on screen.
function renderSlide(slide: DeckSlide, chapterIndex: number, slideIdx: number): string {
  switch (slide.kind) {
    case "cover":
      return `<section class="slide" data-ch="${chapterIndex}" data-slide-idx="${slideIdx}"><div class="inner">
        <div class="eyebrow">${esc(slide.eyebrow)}</div>
        <h1>${esc(slide.title)}</h1>
        <div class="rule"></div>
        <div class="lede">${esc(slide.lede)}</div>
      </div></section>`;

    case "divider":
      return `<section class="slide" data-ch="${chapterIndex}" data-slide-idx="${slideIdx}"><div class="inner">
        <div class="divider">
          <div class="dnum">${esc(slide.chapterNumber)}</div>
          <h1 class="light">${esc(slide.title)}</h1>
          <div class="rule"></div>
          <div class="lede">${esc(slide.lede)}</div>
        </div>
      </div></section>`;

    case "statement":
      return `<section class="slide" data-ch="${chapterIndex}" data-slide-idx="${slideIdx}"><div class="inner">
        ${slide.eyebrow ? `<div class="eyebrow">${esc(slide.eyebrow)}</div>` : ""}
        <div class="statement">${esc(slide.text)}</div>
        ${
          slide.chips?.length
            ? `<div class="chiprow">${slide.chips.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>`
            : ""
        }
      </div></section>`;

    case "quote":
      return `<section class="slide" data-ch="${chapterIndex}" data-slide-idx="${slideIdx}"><div class="inner">
        ${slide.eyebrow ? `<div class="eyebrow">${esc(slide.eyebrow)}</div>` : ""}
        <div class="quote">${esc(slide.quote)}<span class="src">${esc(slide.source)}</span></div>
        ${slide.note ? `<div class="note">${esc(slide.note)}</div>` : ""}
      </div></section>`;

    case "cards":
      return `<section class="slide" data-ch="${chapterIndex}" data-slide-idx="${slideIdx}"><div class="inner">
        ${slide.eyebrow ? `<div class="eyebrow">${esc(slide.eyebrow)}</div>` : ""}
        <div class="grid g${slide.columns}">
          ${slide.cards
            .map(
              (c) => `<div class="card${c.highlight ? " hl" : ""}">
                <div class="tag">${esc(c.tag)}</div>
                <div class="ct">${esc(c.title)}</div>
                <p>${esc(c.body)}</p>
              </div>`
            )
            .join("")}
        </div>
      </div></section>`;

    case "stats":
      return `<section class="slide" data-ch="${chapterIndex}" data-slide-idx="${slideIdx}"><div class="inner">
        ${slide.eyebrow ? `<div class="eyebrow">${esc(slide.eyebrow)}</div>` : ""}
        <div class="grid g3">
          ${slide.stats
            .map(
              (s) => `<div class="stat txt">
                <div class="sv">${esc(s.value)}</div>
                <div class="sk">${esc(s.label)}</div>
                <div class="sd">${esc(s.detail)}</div>
              </div>`
            )
            .join("")}
        </div>
        ${slide.note ? `<div class="note">${esc(slide.note)}</div>` : ""}
      </div></section>`;

    case "list":
      return `<section class="slide" data-ch="${chapterIndex}" data-slide-idx="${slideIdx}"><div class="inner">
        ${slide.eyebrow ? `<div class="eyebrow">${esc(slide.eyebrow)}</div>` : ""}
        <ul class="list">
          ${slide.items.map((it, i) => `<li><span class="n">${String(i + 1).padStart(2, "0")}</span>${esc(it)}</li>`).join("")}
        </ul>
        ${slide.note ? `<div class="note">${esc(slide.note)}</div>` : ""}
      </div></section>`;

    case "gaterow":
      return `<section class="slide" data-ch="${chapterIndex}" data-slide-idx="${slideIdx}"><div class="inner">
        ${slide.eyebrow ? `<div class="eyebrow">${esc(slide.eyebrow)}</div>` : ""}
        <div class="rail">
          ${slide.gates
            .map(
              (g, i) => `<div class="rl" style="--sc:${PALETTE[i % PALETTE.length]}">
                <div class="rn">${String(i + 1).padStart(2, "0")} · ${esc(g.name)}</div>
                <div class="rt">${esc(g.name)}</div>
                <p>${esc(g.detail)}</p>
                <div class="own">${esc(g.owner)}</div>
              </div>`
            )
            .join("")}
        </div>
        <div class="lockgate">
          <div>
            <div class="lgt">${esc(slide.gateLabel)}</div>
            <div class="lgd">${esc(slide.gateDetail)}</div>
          </div>
        </div>
        ${slide.note ? `<div class="note">${esc(slide.note)}</div>` : ""}
      </div></section>`;

    case "closing":
      return `<section class="slide" data-ch="${chapterIndex}" data-slide-idx="${slideIdx}"><div class="inner">
        <div class="eyebrow">${esc(slide.eyebrow)}</div>
        <h1>${esc(slide.title)}</h1>
        <div class="rule"></div>
        <div class="lede">${esc(slide.lede)}</div>
      </div></section>`;
  }
}

const CSS = `:root{--ground:#0B0E11;--ground-view:#101317;--card-dark:#171B20;--hair-1:#1B2027;--hair-2:#22272D;--hair-3:#262B31;--hair-4:#2A3037;--accent:#F97316;--accent-700:#C85D12;--accent-800:#B65510;--primary:#0A66C2;--link-dark:#57A8EE;--ink-body:#E8EBEE;--ink-head:#F4F6F8;--ink-2:#A8B0B9;--muted-2:#7E858E;--muted-3:#737B84;--font-display:'Space Grotesk','Inter',-apple-system,sans-serif;--font-body:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;--shell-max:1320px;--view:var(--accent);}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;background:var(--ground);color:var(--ink-body);font-family:var(--font-body);overflow:hidden;-webkit-font-smoothing:antialiased;}
.app{display:flex;flex-direction:column;height:100vh;width:100vw;}
.topbar{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:0 34px;height:62px;border-bottom:1px solid var(--hair-2);background:var(--ground);}
.wordmark{font-family:var(--font-display);font-weight:700;font-size:14px;letter-spacing:0.16em;color:var(--ink-head);white-space:nowrap;}
.chapnav{display:flex;gap:4px;overflow:hidden;flex-wrap:nowrap;}
.chapnav button{all:unset;cursor:pointer;font-size:10.5px;font-weight:600;letter-spacing:0.11em;text-transform:uppercase;color:var(--muted-3);padding:7px 10px;border-bottom:2px solid transparent;white-space:nowrap;transition:color .25s ease,border-color .25s ease;}
.chapnav button:hover{color:var(--ink-2);}
.chapnav button.active{color:var(--view);border-bottom-color:var(--view);}
.cobrand{display:flex;align-items:center;gap:12px;white-space:nowrap;}
.cobrand .prep{font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:var(--muted-3);}
.cobrand .clientname{font-family:var(--font-display);font-weight:700;font-size:13px;color:var(--ink-2);}
.stage{flex:1;position:relative;overflow:hidden;background:var(--ground-view);}
.slide{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:46px 54px;opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity .3s ease,transform .3s ease;}
.slide.active{opacity:1;transform:translateY(0);pointer-events:auto;}
.inner{width:100%;max-width:var(--shell-max);display:flex;flex-direction:column;gap:26px;}
.eyebrow{font-family:var(--font-display);font-weight:600;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:var(--view);}
h1{font-family:var(--font-display);font-weight:700;font-size:clamp(34px,4.4vw,58px);line-height:1.06;color:var(--accent);letter-spacing:-0.015em;}
h1.light{color:var(--ink-head);}
.lede{font-size:clamp(16.5px,1.5vw,21px);line-height:1.6;color:var(--ink-2);max-width:900px;font-weight:300;}
.statement{font-family:var(--font-display);font-weight:500;font-size:clamp(22px,2.6vw,36px);line-height:1.32;color:var(--ink-head);max-width:1020px;letter-spacing:-0.01em;}
.note{font-size:16px;line-height:1.62;color:var(--ink-2);max-width:980px;font-weight:300;}
.quote{font-family:var(--font-display);font-weight:500;font-size:clamp(20px,2.4vw,33px);line-height:1.34;color:var(--ink-head);max-width:1000px;border-left:3px solid var(--accent);padding-left:26px;letter-spacing:-0.01em;}
.quote .src{display:block;margin-top:18px;font-family:var(--font-body);font-weight:500;font-size:12.5px;letter-spacing:0.13em;text-transform:uppercase;color:var(--muted-2);}
.grid{display:grid;gap:16px;width:100%;}
.g2{grid-template-columns:1fr 1fr;} .g3{grid-template-columns:repeat(3,1fr);}.g4{grid-template-columns:repeat(4,1fr);}
.card{background:var(--card-dark);border:1px solid var(--hair-3);border-radius:9px;padding:26px 24px;display:flex;flex-direction:column;gap:10px;}
.card.hl{border-color:var(--accent-800);}
.card .ct{font-family:var(--font-display);font-weight:700;font-size:18px;color:var(--ink-head);}
.card.hl .ct{color:var(--accent);}
.card p{font-size:15.5px;line-height:1.6;color:var(--ink-2);font-weight:300;}
.card .tag{font-size:10.5px;letter-spacing:0.15em;text-transform:uppercase;color:var(--muted-2);font-weight:600;}
.stat{background:var(--card-dark);border:1px solid var(--hair-3);border-radius:9px;padding:28px 24px;display:flex;flex-direction:column;gap:9px;}
.stat .sv{font-family:var(--font-display);font-weight:700;font-size:clamp(30px,3.4vw,45px);color:var(--accent);line-height:1;}
.stat.txt .sv{font-size:clamp(19px,2.1vw,27px);line-height:1.16;}
.stat .sk{font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--muted-2);font-weight:600;}
.stat .sd{font-size:14.5px;line-height:1.55;color:var(--ink-2);font-weight:300;}
.rail{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;width:100%;}
.rl{background:var(--card-dark);border:1px solid var(--hair-3);border-top:3px solid var(--sc);border-radius:0 0 9px 9px;padding:22px 18px;display:flex;flex-direction:column;gap:10px;}
.rl .rn{font-family:var(--font-display);font-weight:700;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--sc);}
.rl .rt{font-family:var(--font-display);font-weight:700;font-size:18px;color:var(--ink-head);line-height:1.22;}
.rl p{font-size:14.5px;line-height:1.55;color:var(--ink-2);font-weight:300;}
.rl .own{margin-top:auto;padding-top:12px;border-top:1px solid var(--hair-2);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--sc);font-weight:600;opacity:.85;}
.list{display:flex;flex-direction:column;gap:17px;width:100%;max-width:980px;}
.list li{list-style:none;display:flex;gap:20px;align-items:flex-start;font-size:18px;line-height:1.52;color:var(--ink-body);font-weight:300;}
.list .n{font-family:var(--font-display);font-weight:700;font-size:13.5px;color:var(--accent);min-width:26px;padding-top:4px;letter-spacing:0.05em;}
.chiprow{display:flex;flex-wrap:wrap;gap:8px;}
.chip{display:inline-flex;align-items:center;padding:7px 15px;border-radius:999px;font-family:var(--font-body);font-size:12.5px;font-weight:700;letter-spacing:0.01em;white-space:nowrap;color:var(--ground);background:var(--link-dark);}
.divider{position:relative;width:100%;}
.dnum{position:absolute;top:50%;left:0;transform:translateY(-56%);font-family:var(--font-display);font-weight:700;font-size:clamp(120px,17vw,210px);color:var(--view);opacity:.07;line-height:1;user-select:none;z-index:0;letter-spacing:-0.04em;}
.divider>*:not(.dnum){position:relative;z-index:1;}
.rule{width:58px;height:3px;background:var(--view);margin:20px 0;}
.botbar{position:relative;flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 34px;height:52px;border-top:1px solid var(--hair-2);background:var(--ground);}
.counter{font-size:11px;letter-spacing:0.13em;color:var(--muted-3);font-variant-numeric:tabular-nums;display:flex;gap:13px;align-items:center;text-transform:uppercase;}
.counter .cur{color:var(--view);font-weight:600;}
.navhint{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:8px;white-space:nowrap;font-size:10.5px;letter-spacing:0.1em;text-transform:uppercase;font-weight:500;color:var(--muted-3);}
.navhint kbd{font-family:var(--font-body);font-size:10px;font-weight:600;line-height:1;border:1px solid var(--hair-4);border-radius:4px;padding:4px 7px;color:var(--ink-2);background:var(--card-dark);letter-spacing:0.04em;}
.navhint .sep{color:var(--hair-4);}
.navbtns{display:flex;gap:9px;}
.navbtns button{all:unset;cursor:pointer;display:flex;align-items:center;gap:7px;padding:7px 14px;border:1px solid var(--hair-4);border-radius:5px;font-size:10.5px;letter-spacing:0.13em;text-transform:uppercase;color:var(--ink-2);font-weight:600;transition:border-color .2s,color .2s,background-color .2s;}
#prev{border-color:rgba(87,168,238,.42);color:var(--link-dark);}
#prev:hover{border-color:var(--link-dark);color:var(--link-dark);background:rgba(87,168,238,.12);}
#next{border-color:rgba(249,115,22,.42);color:var(--accent);}
#next:hover{border-color:var(--accent);color:var(--accent);background:rgba(249,115,22,.12);}
.progress{position:absolute;left:0;bottom:0;height:2px;background:var(--accent);transition:width .3s ease;z-index:6;}
.lockgate{display:flex;align-items:center;gap:16px;background:var(--accent);border-radius:9px;padding:15px 22px;}
.lockgate .lgt{font-family:var(--font-display);font-weight:700;font-size:14.5px;color:var(--ground);letter-spacing:0.06em;}
.lockgate .lgd{font-size:13px;line-height:1.4;color:rgba(11,14,17,.8);font-weight:500;}
.gatebadge{display:inline-block;font-family:var(--font-display);font-weight:700;font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-2);border:1px solid var(--hair-4);border-radius:20px;padding:4px 12px;margin-bottom:10px;}
@media (max-width:1220px){.chapnav button{padding:7px 7px;font-size:9.5px;letter-spacing:0.08em;}.cobrand .prep{display:none;}}
@media (max-width:1080px){.chapnav button{padding:7px 5px;font-size:8.5px;letter-spacing:0.05em;}.wordmark{font-size:12px;}}
@media (max-width:1000px){.g2,.g3,.g4{grid-template-columns:1fr;}.rail{grid-template-columns:1fr;}.chapnav{display:none;}.navhint{display:none;}.slide{padding:30px 22px;}}`;

function navScript(chapterFirstIndices: number[], chapterTitles: string[]): string {
  return `(function(){
    var CH = ${JSON.stringify(chapterTitles.map((t, i) => ({ t, c: PALETTE[i % PALETTE.length], first: chapterFirstIndices[i] })))};
    var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
    var total = slides.length, cur = 0;
    var root = document.documentElement;
    var nav = document.getElementById("chapnav");
    CH.forEach(function(c){
      var b = document.createElement("button");
      b.textContent = c.t;
      b.addEventListener("click", function(){ go(c.first); });
      nav.appendChild(b);
    });
    var navBtns = Array.prototype.slice.call(nav.querySelectorAll("button"));
    // Editable-preview bridge: when this deck is iframed by the authoring
    // app, tell the parent which manifest slide is on screen every time it
    // changes, so the app's "Revise this slide" action always targets what
    // you're actually looking at. A no-op when opened standalone (top-level
    // window) or by any other embedder that isn't listening for this.
    function notifyParent(ci, slideIdx){
      if (window.parent === window) return;
      window.parent.postMessage({ type: "revplan-active-slide", chapterIndex: ci, slideIndex: slideIdx, globalIndex: cur, total: total }, "*");
    }
    function paint(){
      var s = slides[cur];
      var ci = parseInt(s.dataset.ch, 10);
      var slideIdx = parseInt(s.dataset.slideIdx, 10);
      root.style.setProperty("--view", CH[ci].c);
      document.getElementById("cnum").textContent = String(cur + 1).padStart(2, "0");
      document.getElementById("cname").textContent = CH[ci].t;
      document.getElementById("progress").style.width = ((cur + 1) / total * 100) + "%";
      navBtns.forEach(function(b, i){ b.classList.toggle("active", i === ci); });
      notifyParent(ci, slideIdx);
    }
    function go(i){
      if (i < 0 || i >= total || i === cur) return;
      slides[cur].classList.remove("active");
      cur = i;
      slides[cur].classList.add("active");
      paint();
    }
    document.getElementById("next").addEventListener("click", function(){ go(cur + 1); });
    document.getElementById("prev").addEventListener("click", function(){ go(cur - 1); });
    document.addEventListener("keydown", function(e){
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(cur + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); }
    });
    var tx = 0;
    document.addEventListener("touchstart", function(e){ tx = e.changedTouches[0].screenX; });
    document.addEventListener("touchend", function(e){
      var d = e.changedTouches[0].screenX - tx;
      if (Math.abs(d) > 50) go(d < 0 ? cur + 1 : cur - 1);
    });
    var startAt = parseInt(new URLSearchParams(location.search).get("slide") || "0", 10);
    if (startAt > 0 && startAt < total) {
      slides[0].classList.remove("active");
      cur = startAt;
      slides[cur].classList.add("active");
    }
    paint();
  })();`;
}

export function renderDeckHtml(manifest: DeckManifest): string {
  const slidesFlat: { html: string; chapterIndex: number }[] = [];
  const chapterFirstIndices: number[] = [];

  // Slide 0 is always the cover, not part of any named chapter (chapter index -1
  // sentinel isn't used by the nav script, so we fold it into chapter 0's color
  // by giving it data-ch 0 as well; the cover just won't be a nav target).
  const coverChapterIndex = 0;

  manifest.chapters.forEach((ch: DeckChapter, i: number) => {
    chapterFirstIndices.push(slidesFlat.length + 1); // +1 to account for the cover slide inserted at position 0
    ch.slides.forEach((slide, slideIdx) => {
      slidesFlat.push({ html: renderSlide(slide, i, slideIdx), chapterIndex: i });
    });
  });

  const coverSlide: DeckSlide = {
    kind: "cover",
    eyebrow: manifest.eyebrow,
    title: manifest.companyTitle,
    lede: manifest.preparedBy,
  };
  const allSlidesHtml = [renderSlide(coverSlide, coverChapterIndex, -1), ...slidesFlat.map((s) => s.html)];
  // First slide gets the "active" class so it's visible on load.
  const firstSlideHtml = allSlidesHtml[0].replace('class="slide"', 'class="slide active"');
  const restSlidesHtml = allSlidesHtml.slice(1).join("");

  const chapterTitles = manifest.chapters.map((c) => c.title);
  const total = allSlidesHtml.length;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(
    manifest.companyTitle
  )} · Revenue Plan</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head><body>
<div class="app">
  <header class="topbar">
    <div class="wordmark">CHRIS DEBAYLE</div>
    <nav class="chapnav" id="chapnav"></nav>
    <div class="cobrand"><span class="prep">Prepared for</span><span class="clientname">${esc(manifest.companyTitle)}</span></div>
  </header>
  <main class="stage" id="stage">
    ${firstSlideHtml}
    ${restSlidesHtml}
    <div class="progress" id="progress"></div>
  </main>
  <footer class="botbar">
    <div class="counter"><span><span class="cur" id="cnum">01</span> / ${total}</span><span id="cname">Opening</span></div>
    <div class="navhint"><kbd>&larr;</kbd><kbd>&rarr;</kbd><span>arrow keys</span><span class="sep">&middot;</span><kbd>space</kbd><span>to advance</span></div>
    <div class="navbtns"><button id="prev">&larr; Prev</button><button id="next">Next &rarr;</button></div>
  </footer>
</div>
<script>${navScript(chapterFirstIndices, chapterTitles)}</script>
</body></html>`;
}

export function slugify(company: string): string {
  return (
    company
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "plan"
  );
}
