/* Atomic Minds — test player assets, moved verbatim out of index.html.
   Loaded as a plain classic <script src="tms-player.js"> BEFORE the main app script, so the
   globals TMS_PLAYER_CSS / TMS_PLAYER_BODY / tmsPlayerMain exist when buildTestHTML() runs.
   tmsPlayerMain is serialised with .toString() into the iframe: keep it self-contained, ES5-style,
   with NO access to outer scope, and do not run this file through a minifier/bundler. */
const TMS_PLAYER_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
/* Scrolling: the document (html) is the ONE vertical scroller. body must not become a scroll container
   (overflow-x:hidden on body made it one, and overscroll-behavior on it then blocked scrolling entirely),
   so horizontal overflow is clipped without creating a scroll container and content is kept inside the width. */
html{overscroll-behavior-y:contain}
*{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
input,textarea{-webkit-user-select:text;user-select:text}
img{-webkit-user-drag:none}
body{overflow-x:clip;font-family:system-ui,-apple-system,sans-serif;background:#0d1117;color:#e6edf3;font-size:14px;overflow-wrap:break-word}
@supports not (overflow-x:clip){body{overflow-x:hidden}}
img,svg,video,canvas{max-width:100%}
img,video,canvas{height:auto}
table{display:block;max-width:100%;overflow-x:auto}
pre{max-width:100%;overflow-x:auto;white-space:pre-wrap}
mjx-container{max-width:100%}
mjx-container[display="true"]{overflow-x:auto;overflow-y:hidden}
.q-text,.otext,.explain-box,.opt>div:not(.key){min-width:0;overflow-wrap:anywhere}
#introScreen,#testScreen,#reviewScreen{padding:12px}
.intro{display:flex;flex-direction:column;justify-content:center;min-height:100vh;text-align:center}
.intro h1{font-size:20px;margin-bottom:6px}
.attempt-tag{display:inline-block;align-self:center;font-size:11px;font-weight:700;color:#a89ae0;background:rgba(127,119,221,.15);border-radius:20px;padding:3px 10px;margin-bottom:8px}
.meta-line{font-size:13px;color:#8b949e;margin-bottom:18px}
.instr{text-align:left;background:#161b22;border-radius:10px;padding:14px 16px;margin:0 auto 18px;max-width:420px;font-size:13px;line-height:1.8;color:#c9d1d9}
.startBtn{padding:14px 28px;background:#7f77dd;color:#fff;border:none;border-radius:10px;font-weight:700;font-size:15px;cursor:pointer;align-self:center}
.startBtn:disabled{opacity:.6;cursor:default}
.start-err{color:#f87171;font-size:12px;max-width:420px;margin:12px auto 0;line-height:1.5}
.header{background:#161b22;border-radius:10px;padding:12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;gap:10px;z-index:5}
.title{font-weight:700;font-size:14px}
.progress-bar{height:4px;background:#21262d;border-radius:2px;overflow:hidden;margin-top:6px;width:100%}
.progress-fill{height:100%;background:#7f77dd;transition:width .2s}
.timer{color:#ef4444;font-weight:700;font-family:monospace;font-size:16px;flex-shrink:0}
.palette{display:flex;flex-wrap:wrap;gap:5px;padding:10px 12px;background:#161b22;border-radius:10px;margin-bottom:10px}
.pb{width:28px;height:28px;border-radius:6px;border:1.5px solid transparent;font-size:11px;font-weight:700;cursor:pointer;background:#1c2333;color:#8b949e;position:relative}
.pb.done{background:rgba(34,197,94,.3);color:#4ade80}
.pb.na{background:rgba(239,68,68,.18);color:#f87171;border-color:rgba(239,68,68,.55)}
.pb.cur{background:#7f77dd;color:#fff;border-color:#7f77dd}
.pb.rc{background:rgba(34,197,94,.3);color:#4ade80}
.pb.rw{background:#ef4444;color:#fff}
.pb.ru{background:rgba(239,68,68,.12);color:#f87171;border-color:#ef4444}
.pb.rn{background:#1c2333;color:#8b949e}
.mkdot{position:absolute;top:-3px;right:-3px;width:7px;height:7px;border-radius:50%;background:#f5b642;box-shadow:0 0 0 1.5px #161b22}
.legend{display:flex;flex-wrap:wrap;gap:10px;font-size:10px;color:#8b949e;margin:0 0 10px;padding:0 4px}
.review-filters{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px;margin-bottom:2px;-webkit-overflow-scrolling:touch}
.review-filters::-webkit-scrollbar{display:none}
.rf{flex:0 0 auto;padding:7px 13px;border-radius:20px;border:1px solid #30363d;background:#161b22;color:#c9d1d9;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap}
.rf.active{background:#7f77dd;border-color:#7f77dd;color:#fff}
.empty-filter{text-align:center;font-size:12px;color:#8b949e;padding:20px 10px;background:#161b22;border-radius:10px;margin-bottom:10px}
.markBadge{font-size:10px;font-weight:700;color:#f5b642;white-space:nowrap;flex-shrink:0}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;vertical-align:-1px;border:1.5px solid transparent}
.q-card{background:#161b22;border-radius:10px;padding:14px;margin-bottom:10px}
.q-num-row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}
.q-num{font-size:11px;color:#8b949e;margin-bottom:6px}
.q-num-row .q-num{margin-bottom:0}
.markBtn{font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;border:1px solid #30363d;background:#1c2333;color:#8b949e;cursor:pointer;white-space:nowrap;flex-shrink:0}
.markBtn.on{background:rgba(245,182,66,.18);border-color:#f5b642;color:#f5b642}
.q-text{font-size:14px;margin-bottom:10px;line-height:1.6}
.q-text img{max-width:100%;border-radius:6px;margin:6px 0}
.q-image{margin:10px 0}
.q-image img{max-width:100%;height:auto;border-radius:8px;display:block}
.q-image .imgerr{font-size:12px;color:#ef4444;padding:10px;background:#1c1116;border-radius:8px}
.opts{margin-top:4px}
.opts.layout-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.opts.layout-h{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.opts.layout-v{display:flex;flex-direction:column;gap:8px}
.opt{display:flex;gap:8px;align-items:center;padding:9px 10px;border:1px solid #30363d;border-radius:8px;cursor:pointer}
.opt.sel{border-color:#7f77dd;background:rgba(127,119,221,.15)}
.opt.noTextOpt{justify-content:center}
.key{width:20px;height:20px;border-radius:50%;background:#0d1117;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
.opt.noTextOpt .key{width:32px;height:32px;font-size:14px}
.clear-hint{font-size:11px;color:#6b7280;margin-top:8px}
.navrow{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.nb{padding:10px;border-radius:8px;border:none;font-weight:700;font-size:13px;cursor:pointer;background:#1c2333;color:#e6edf3}
.nb:disabled{opacity:.4;cursor:default}
.nb.submitStyle{background:#ef4444;color:#fff}
.result{background:#161b22;border-radius:10px;padding:16px;text-align:center;margin-bottom:10px}
.rmeta{font-size:12px;color:#8b949e;margin-top:3px}
.score{display:flex;align-items:center;justify-content:center;gap:10px;margin:14px 0 4px;line-height:1}
.score-num{font-size:52px;font-weight:800;color:#8b7cf6;letter-spacing:-1px}
.score-out{font-size:30px;font-weight:500;color:#8a90b8;align-self:flex-end;padding-bottom:5px}
.score-div{width:1px;height:42px;background:#363c63;margin:0 6px}
.score-pct{font-size:18px;font-weight:700;color:#e9e6ff;background:rgba(124,108,246,.16);border:1px solid rgba(139,124,246,.38);border-radius:20px;padding:7px 15px}
.rstats{display:grid;grid-template-columns:repeat(3,1fr);margin:16px 0 0;border:1px solid #2a3150;background:rgba(10,14,28,.55);border-radius:12px}
.rs{position:relative;padding:12px 4px 11px;min-width:0}
.rs+.rs::before{content:"";position:absolute;left:0;top:20%;bottom:20%;width:1px;background:#2a3150}
.rs-top{display:flex;align-items:center;justify-content:center;gap:8px}
.rs-ic{width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex:none}
.rs-ic svg{width:14px;height:14px;display:block;fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.rs-n{font-size:22px;font-weight:800;line-height:1}
.rs-l{font-size:12.5px;color:#8b93c4;margin-top:6px}
.rs-ok .rs-ic{background:#1f9a62}.rs-ok .rs-n{color:#4ade99}
.rs-no .rs-ic{background:#b3364a}.rs-no .rs-n{color:#f26b7c}
.rs-un .rs-ic{background:#3a4070}.rs-un .rs-ic svg{stroke:#c9cdf5}.rs-un .rs-n{color:#b4b9f0}
.rtime{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;font-size:13px;color:#8b93c4}
.rtime svg{width:17px;height:17px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.banner{background:#1f1a0d;border:1px solid #6b5a1a;color:#fbbf24;border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.5;margin-bottom:10px}
.sol{background:#161b22;border-radius:10px;padding:12px;margin-top:10px;scroll-margin-top:8px}
.sol.correct{border-left:3px solid #22c55e}
.sol.wrong{border-left:3px solid #ef4444}
.sol.unans{border-left:3px solid #ef4444;background:#1a1416}
.sol.notseen{border-left:3px solid #6b7280}
.st{font-size:12px;font-weight:700;margin:6px 0}
.st.correct{color:#4ade80}.st.wrong,.st.unans{color:#f87171}.st.notseen{color:#8b949e}
.q-time{font-size:11px;color:#8b949e;margin:0 0 8px}
.ropt{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border:1px solid #30363d;border-radius:8px;margin-top:6px}
.ropt.correct{border-color:#22c55e;background:rgba(34,197,94,.12)}
.ropt.wrongpick{border-color:#ef4444;background:rgba(239,68,68,.12)}
.ropt .otext{flex:1;min-width:0;line-height:1.5}
.tag{margin-left:auto;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;white-space:nowrap;flex-shrink:0}
.tag.ok{background:rgba(34,197,94,.25);color:#4ade80}
.tag.no{background:rgba(239,68,68,.25);color:#f87171}
.rq-image img{max-width:100%;border-radius:8px;margin:6px 0}
.explain-box{margin-top:10px;padding-top:8px;border-top:1px dashed #30363d;font-size:12px;color:#a0aab6;line-height:1.6}
.explain-box b{display:block;font-size:11px;color:#8b949e;margin-bottom:3px}
.explain-box img{max-width:100%;border-radius:6px;margin:6px 0}
.explain-link{color:#7f77dd;font-size:12px;display:inline-block;margin-top:4px}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.65);display:none;align-items:center;justify-content:center;z-index:50;padding:20px;overflow-y:auto}
.modal-bg.open{display:flex}
.modal-card{background:#161b22;border-radius:12px;padding:18px;max-width:340px;width:100%;text-align:center;margin:auto}
.modal-card p{font-size:13px;color:#c9d1d9;line-height:1.6;margin-bottom:16px}
.modal-actions{display:flex;gap:8px}
.modal-actions button{flex:1;padding:10px;border-radius:8px;border:none;font-weight:700;font-size:13px;cursor:pointer}
.modal-actions button:disabled{opacity:.5}
.mCancel{background:#21262d;color:#e6edf3}
.mSubmit{background:#ef4444;color:#fff}
.flash{position:fixed;left:12px;right:12px;bottom:14px;background:#21262d;color:#e6edf3;border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.5;z-index:60;box-shadow:0 4px 18px rgba(0,0,0,.5)}
.pdf-actions{margin:18px 0 6px;text-align:center}
.pdfBtn{padding:12px 22px;background:#1c2333;color:#e6edf3;border:1px solid #30363d;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer}
.pdfBtn:active{background:#232a3d}
.pdf-hint{font-size:11px;color:#6b7280;margin-top:6px}

/* ---------------- print (Save as PDF) ----------------
   Printing is triggered from INSIDE this iframe (window.print() called on the iframe's own
   window prints just this document), so the parent app's chrome — top bar, bottom nav, the
   Close button above this frame — is never part of what gets printed; nothing there needs
   hiding. Everything below only reflows THIS document for paper: dark theme -> readable
   light theme, non-printable controls hidden, review cards kept from splitting across pages. */
@media print{
  html,body{background:#fff !important;color:#111 !important}
  #introScreen,#testScreen,#confirmModal,#busyModal,.flash,.no-print,.legend,#rvPalette,.review-filters,.empty-filter{display:none !important}
  #reviewScreen{display:block !important;padding:0 !important}
  .banner{display:none !important}
  .result{background:#fff;border:1px solid #999;color:#111;padding:10px 0;page-break-inside:avoid;break-inside:avoid}
  .rmeta{color:#333}
  .score-num{color:#111}
  .score-out{color:#555}
  .score-div{background:#999}
  .score-pct{background:#fff;border:1px solid #999;color:#111}
  .rstats{background:#fff;border:1px solid #999}
  .rs+.rs::before{background:#999}
  .rs-n,.rs-l,.rtime{color:#111 !important}
  .rs-ic{background:#fff !important;border:1px solid #666}
  .rs-ic svg{stroke:#111 !important}
  .sol{display:block !important;background:#fff;border:1px solid #ccc;color:#111;page-break-inside:avoid;break-inside:avoid;margin-top:14px}
  .sol.correct{border-left:4px solid #16a34a}
  .sol.wrong,.sol.unans{border-left:4px solid #dc2626}
  .sol.notseen{border-left:4px solid #666}
  .q-num,.q-time{color:#555}
  .markBadge{color:#b45309}
  .q-text{color:#111}
  .st.correct{color:#15803d}
  .st.wrong,.st.unans{color:#b91c1c}
  .st.notseen{color:#555}
  .ropt{border:1px solid #ccc;background:#fff;color:#111}
  .ropt.correct{border-color:#16a34a;background:#f0fdf4}
  .ropt.wrongpick{border-color:#dc2626;background:#fef2f2}
  .tag{border:1px solid currentColor;background:#fff !important}
  .tag.ok{color:#15803d}
  .tag.no{color:#b91c1c}
  .explain-box{border-top:1px dashed #999;color:#333}
  .q-image img,.rq-image img,.explain-box img{max-width:100% !important;page-break-inside:avoid}
  .explain-link{color:#111;text-decoration:underline}
  @page{margin:14mm}
}
`;

const TMS_PLAYER_BODY = `
<div id="introScreen" class="intro">
  <h1 id="introTitle"></h1>
  <div class="attempt-tag" id="introLabel" style="display:none"></div>
  <div class="meta-line" id="introMeta"></div>
  <div class="instr" id="introInstr"></div>
  <button class="startBtn" id="startBtn">Start Test</button>
  <div class="start-err" id="startErr"></div>
</div>

<div id="testScreen" style="display:none">
  <div class="header">
    <div style="flex:1;min-width:0">
      <div class="title" id="hdrTitle" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>
      <div style="font-size:11px;color:#8b949e" id="hdrProgress"></div>
      <div class="progress-bar"><div class="progress-fill" id="progFill"></div></div>
    </div>
    <div class="timer" id="tm">--:--</div>
  </div>
  <div class="palette" id="palette"></div>
  <div class="legend"><span><i style="background:rgba(34,197,94,.3)"></i>Answered</span><span><i style="background:rgba(239,68,68,.18);border-color:rgba(239,68,68,.55)"></i>Seen, not answered</span><span><i style="background:#1c2333"></i>Not seen</span></div>
  <div id="quizArea"></div>
  <div class="navrow"><button class="nb" id="prevB">← Prev</button><button class="nb" id="nextB">Next →</button></div>
</div>

<div id="reviewScreen" style="display:none"></div>

<div class="modal-bg" id="confirmModal">
  <div class="modal-card">
    <p id="confirmText"></p>
    <div class="modal-actions"><button class="mCancel" id="mCancelBtn">Cancel</button><button class="mSubmit" id="mSubmitBtn">Submit</button></div>
  </div>
</div>

<div class="modal-bg" id="busyModal">
  <div class="modal-card">
    <p id="busyText"></p>
    <div class="modal-actions" id="busyActions" style="display:none"></div>
  </div>
</div>
`;

// Runs INSIDE the iframe. Reads the globals QUESTIONS, BOOT, TITLE, SUBJECT,
// LAYOUT_CLASS declared by the preceding <script>. Never called in the app itself.
function tmsPlayerMain(){
  var KEYS = ['A','B','C','D'];
  var N = QUESTIONS.length;
  var mode = BOOT.mode || 'practice';
  var cur = 0, answers = [], seen = [], marked = [];
  for(var z=0; z<N; z++){ answers.push(null); seen.push(false); marked.push(false); }
  var started = false, submitting = false, done = false, lastAuto = false, lastReason = '', deadline = 0, timerHandle = null, lastGesture = 0;

  /* ---------------- per-question active time (local only until final submission) ----------------
     qTime[i] = accumulated whole seconds spent actively viewing question i. timeCur/timeStartedAt
     track the CURRENTLY running segment; renderQ() below is the single choke point for every kind
     of navigation (palette tap, Prev/Next, or a resumed position), so switching questions there —
     and ONLY there — is what starts/stops a segment. A same-question re-render (e.g. after picking
     an answer) leaves timeCur === cur and is a no-op, so nothing is double-counted. Visibility
     pause/resume stops and restarts the clock without touching qTime for any other question. */
  var qTime = []; for(var zt=0; zt<N; zt++) qTime.push(0);
  var timeCur = -1, timeStartedAt = 0, qtHandle = null;
  var currentApplyReviewFilter = null;   // set fresh each renderReview(); the delegated click handler below calls it
  function timeFlush(){
    if(timeCur >= 0 && timeStartedAt){
      var delta = Math.round((Date.now() - timeStartedAt)/1000);
      if(delta > 0) qTime[timeCur] += delta;
    }
    timeStartedAt = 0;
  }
  function timeSwitch(i){
    if(i === timeCur) return;          // same question re-rendering — never double-count
    timeFlush();
    timeCur = i;
    if(!document.hidden) timeStartedAt = Date.now();
  }
  function timePause(){ timeFlush(); }
  function timeResume(){ if(timeCur >= 0 && started && !done) timeStartedAt = Date.now(); }
  // Periodic checkpoint (attempt mode only): flushes the running segment into qTime and restarts
  // it immediately, then piggybacks on the existing local-persistence message — so a refresh or a
  // closed tab never loses more than one checkpoint interval's worth of the CURRENT question's time.
  // This is still zero Firestore reads/writes: saveState() only ever posts to the parent, which
  // only ever writes to localStorage (Firestore is touched solely by the existing Start/Submit calls).
  function timeCheckpoint(){
    if(!started || done) return;
    if(timeCur >= 0 && timeStartedAt){
      var delta = Math.round((Date.now() - timeStartedAt)/1000);
      if(delta > 0) qTime[timeCur] += delta;
      timeStartedAt = document.hidden ? 0 : Date.now();
    }
    saveState();
  }

  function $(id){ return document.getElementById(id); }
  function h(s){ return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function num(x){ return String(Math.round((Number(x)||0)*100)/100); }
  function post(m){ m.tms = 1; try{ window.parent.postMessage(m, '*'); }catch(e){} }
  function typeset(node){ try{ if(window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([node]); }catch(e){} }
  function flash(msg){
    var d = document.createElement('div'); d.className = 'flash'; d.textContent = msg;
    document.body.appendChild(d); setTimeout(function(){ if(d.parentNode) d.parentNode.removeChild(d); }, 4500);
  }
  function fmtDate(ms){
    if(!ms) return '';
    try{ return new Date(ms).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; }
  }
  // MM:SS, or H:MM:SS once an hour is reached. Whole seconds only — matches how qTime is accumulated.
  function fmtDur(sec){
    sec = Math.max(0, Math.round(Number(sec)||0));
    var hh = Math.floor(sec/3600), mm = Math.floor((sec%3600)/60), ss = sec%60;
    var mmss = String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0');
    return hh>0 ? (hh+':'+mmss) : mmss;
  }
  // Part N — suggest a descriptive filename for "Save as PDF" by setting document.title right
  // before printing (TITLE/SUBJECT are this same script's own top-level consts; BOOT.review is
  // only present in review mode, which is the only mode this button is ever shown in). Browsers
  // that offer "Save as PDF" from the print dialog default the suggested filename to
  // document.title, so this is the only lever available without a PDF library — the browser/OS
  // still has the final say, and some ignore it entirely.
  function pdfNamePart(s){
    s = String(s||'').trim();
    if(!s) return '';
    // Any run of characters that aren't letters/digits — spaces, hyphens, punctuation,
    // anything invalid in a filename — collapses to a single underscore, e.g.
    // "Full Test - 01" -> "Full_Test_01" (matches the required filename example exactly).
    s = s.replace(/[^A-Za-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
    return s;
  }
  function pdfSuggestedTitle(){
    // No literal ".pdf" in the title: Chrome's Save-as-PDF appends ".pdf" to whatever
    // document.title already is, so a title ending in ".pdf" would come out "...pdf.pdf"
    // there — the browser adding the extension already gets the filename the spec asks for.
    var parts = [pdfNamePart(SUBJECT), pdfNamePart(TITLE), pdfNamePart(BOOT.review && BOOT.review.studentName)].filter(Boolean);
    parts.push('AtomicMinds');
    return parts.join('_');
  }
  // Native print only (no library, no server round-trip) — the button just opens the browser/OS
  // print dialog; whether "Save as PDF" is offered there is entirely up to the device, so this
  // never claims a PDF was produced, only that printing was attempted.
  function doPrint(){
    try{
      if(typeof window.print !== 'function'){
        flash('Printing isn\u2019t supported in this browser. Open this review in a supported browser and use its Print / Save as PDF option.');
        return;
      }
      var originalTitle = document.title;
      var suggested = pdfSuggestedTitle();
      var restored = false;
      function restoreTitle(){
        if(restored) return; restored = true;
        document.title = originalTitle;
        window.removeEventListener('afterprint', restoreTitle);
      }
      if(suggested) document.title = suggested;
      // 'afterprint' fires once the print/Save-as-PDF dialog is dismissed on every desktop
      // browser and modern mobile Chrome; some mobile browsers never fire it at all, so a
      // timeout restores the title regardless (best-effort — see requirement 5's own caveat).
      window.addEventListener('afterprint', restoreTitle);
      setTimeout(restoreTitle, 4000);
      window.print();
    }catch(e){
      flash('Couldn\u2019t open the print dialog. Open this review in a supported browser and use its Print / Save as PDF option.');
    }
  }

  // Broken images: hide + show the inline error text (no inline handlers needed)
  document.addEventListener('error', function(e){
    var t = e.target;
    if(t && t.tagName === 'IMG'){
      t.style.display = 'none';
      var n = t.nextElementSibling;
      if(n && n.className === 'imgerr') n.style.display = 'block';
    }
  }, true);

  /* ---------------- intro ---------------- */
  function renderIntro(){
    $('introTitle').textContent = TITLE;
    $('hdrTitle').textContent = TITLE;
    if(BOOT.attemptLabel){ $('introLabel').textContent = BOOT.attemptLabel; $('introLabel').style.display = 'inline-block'; }
    var bits = [];
    if(SUBJECT) bits.push(SUBJECT);
    bits.push(N + (N===1 ? ' question' : ' questions'));
    bits.push(BOOT.durationMin > 0 ? (BOOT.durationMin + ' min') : 'No time limit');
    if(BOOT.fullMarks) bits.push('Full marks ' + num(BOOT.fullMarks));
    $('introMeta').textContent = bits.join(' · ');
    var l = [];
    l.push('• Read each question carefully.');
    l.push('• Select one answer: A, B, C or D. Tap the selected answer again to clear it.');
    l.push('• You may change your answers before submitting.');
    var marks = '• Correct answer: +' + num(BOOT.perCorrect) + ' marks.';
    if(BOOT.perWrong < 0) marks += ' Wrong answer: \u2212' + num(Math.abs(BOOT.perWrong)) + '.';
    marks += ' Unanswered: 0.';
    l.push(marks);
    if(BOOT.durationMin > 0) l.push('• The timer keeps running even if you refresh or leave.');
    if(mode === 'attempt') l.push('• If you leave before submitting, you can resume this attempt on this device.');
    if(mode === 'practice') l.push('• Practice: results stay on this device only.');
    $('introInstr').innerHTML = l.join('<br>');
  }

  /* ---------------- test ---------------- */
  function saveState(){
    if(mode === 'attempt') post({ type:'state', cur:cur, answers:answers, seen:seen, timeSpent:qTime, marked:marked });
  }
  function renderQ(){
    timeSwitch(cur);
    var q = QUESTIONS[cur];
    seen[cur] = true;
    var parts = '<div class="q-card"><div class="q-num-row"><div class="q-num">Question '+(cur+1)+' of '+N+'</div>' +
      '<button type="button" class="markBtn'+(marked[cur]?' on':'')+'" data-mark title="Mark for revision">'+(marked[cur]?'\u2605 Marked':'\u2606 Mark for Revision')+'</button></div>';
    if(q.text) parts += '<div class="q-text">'+q.text+'</div>';
    if(q.imageUrl) parts += '<div class="q-image"><img src="'+h(q.imageUrl)+'" alt=""><div class="imgerr" style="display:none">Image failed to load</div></div>';
    var hasOptText = (q.options||[]).some(function(o){ return o && String(o).trim(); });
    parts += '<div class="opts '+LAYOUT_CLASS+'">';
    for(var i=0;i<4;i++){
      var optText = (q.options && q.options[i]) ? q.options[i] : '';
      var cls = 'opt'+(answers[cur]===i?' sel':'')+(!hasOptText?' noTextOpt':'');
      parts += '<div class="'+cls+'" data-i="'+i+'"><div class="key">'+KEYS[i]+'</div>'+(optText?'<div>'+optText+'</div>':'')+'</div>';
    }
    parts += '</div><div class="clear-hint">Tap the selected answer again to clear it.</div></div>';
    $('quizArea').innerHTML = parts;
    typeset($('quizArea'));
    renderPalette(); updateHeader(); updateNav();
    saveState();
  }
  function selectOpt(i){
    if(submitting || done) return;
    answers[cur] = (answers[cur] === i) ? null : i;   // tapping the selected option again clears it
    renderQ();
  }
  // Navigation aid only — never touches answers/scoring/timing. Re-renders the same question
  // (timeSwitch() above is a no-op when cur hasn't changed, so this never affects active time).
  function toggleMark(){
    if(submitting || done) return;
    marked[cur] = !marked[cur];
    renderQ();
  }
  function renderPalette(){
    var out = '';
    for(var i=0;i<N;i++){
      var c = i===cur ? 'cur' : (answers[i]!=null ? 'done' : (seen[i] ? 'na' : ''));
      out += '<button class="pb '+c+(marked[i]?' mk':'')+'" data-i="'+i+'">'+(i+1)+(marked[i]?'<i class="mkdot"></i>':'')+'</button>';
    }
    $('palette').innerHTML = out;
  }
  function jump(i){ if(submitting||done) return; cur = i; renderQ(); }
  function updateHeader(){
    $('hdrProgress').textContent = 'Question '+(cur+1)+' of '+N+((mode === 'attempt' && BOOT.attemptLabel) ? ' \u00b7 '+BOOT.attemptLabel : '');
    $('progFill').style.width = Math.round(((cur+1)/N)*100)+'%';
  }
  function updateNav(){
    $('prevB').disabled = (cur===0);
    var nb = $('nextB');
    if(cur === N-1){ nb.textContent = 'Submit Test'; nb.classList.add('submitStyle'); }
    else { nb.textContent = 'Next \u2192'; nb.classList.remove('submitStyle'); }
  }

  /* ---------------- timer (derived from a fixed deadline, never a counter) ---------------- */
  function tick(){
    if(done) return;
    var rem = Math.max(0, Math.ceil((deadline - Date.now())/1000));
    var hh = Math.floor(rem/3600), mm = Math.floor((rem%3600)/60), ss = rem%60;
    var txt = (hh>0 ? hh+':' : '') + (hh>0 ? String(mm).padStart(2,'0') : String(mm).padStart(2,'0')) + ':' + String(ss).padStart(2,'0');
    var t = $('tm'); if(t) t.textContent = txt;
    if(rem <= 0){
      if(timerHandle){ clearInterval(timerHandle); timerHandle = null; }
      $('confirmModal').classList.remove('open');
      doSubmit(true);
    }
  }
  function startTicker(){
    if(!(deadline > 0)){ $('tm').textContent = 'No limit'; return; }
    if(timerHandle) clearInterval(timerHandle);
    timerHandle = setInterval(tick, 1000);
    tick();
  }

  function begin(o){
    if(started) return;
    started = true; o = o || {};
    if(o.answers){
      for(var i=0;i<N;i++){ answers[i] = (o.answers[i]==null ? null : o.answers[i]); seen[i] = !!(o.seen && o.seen[i]) || answers[i]!=null; }
      cur = Math.min(Math.max(o.cur||0,0), N-1);
    }
    if(o.timeSpent){ for(var it=0; it<N; it++){ var v = Number(o.timeSpent[it]); qTime[it] = (isFinite(v) && v>0) ? Math.round(v) : 0; } }
    if(o.marked){ for(var im=0; im<N; im++) marked[im] = !!o.marked[im]; }
    deadline = o.deadlineMs || 0;
    $('introScreen').style.display = 'none';
    $('testScreen').style.display = 'block';
    renderQ();
    startTicker();
    // Attempt mode only (Practice has no cross-refresh resume to protect): a light periodic
    // checkpoint so a refresh or a closed tab can never lose more than ~20s of the CURRENT
    // question's time. It only ever posts to the parent -> localStorage — never Firestore.
    if(mode === 'attempt'){ if(qtHandle) clearInterval(qtHandle); qtHandle = setInterval(timeCheckpoint, 20000); }
    if(o.autoSubmit) doSubmit(true, o.autoSubmit);   // e.g. the violation limit was already reached before a reload
  }

  /* ---------------- submit ---------------- */
  function openConfirm(){
    if(submitting || done) return;
    var answered = 0; for(var i=0;i<N;i++) if(answers[i]!=null) answered++;
    var un = N - answered;
    var msg = un > 0
      ? 'You have answered '+answered+'/'+N+' questions. '+un+' question'+(un===1?' is':'s are')+' unanswered. Submit anyway?'
      : 'You have answered all '+N+' questions. Submit your test?';
    $('confirmText').textContent = msg;
    $('confirmModal').classList.add('open');
  }
  function showBusy(msg, actions){
    $('busyText').textContent = msg;
    var a = $('busyActions');
    if(actions){ a.style.display = 'flex'; a.innerHTML = ''; actions.forEach(function(b){ var x = document.createElement('button'); x.textContent = b.label; x.className = b.cls||'mCancel'; x.onclick = b.fn; a.appendChild(x); }); }
    else { a.style.display = 'none'; a.innerHTML = ''; }
    $('busyModal').classList.add('open');
  }
  function hideBusy(){ $('busyModal').classList.remove('open'); }
  function doSubmit(auto, reason){
    if(submitting || done) return;          // double-submit guard
    submitting = true; lastAuto = !!auto; lastReason = reason || '';
    if(timerHandle){ clearInterval(timerHandle); timerHandle = null; }
    timeFlush();                             // capture the segment for whichever question is on screen right now
    $('confirmModal').classList.remove('open');
    $('mSubmitBtn').disabled = true;
    showBusy(reason === 'violations' ? 'Auto-submitting your test\u2026' : auto ? 'Time is up \u2014 submitting your test\u2026' : 'Submitting your test\u2026');
    post({ type:'submit', answers:answers, seen:seen, auto:!!auto, timeSpent:qTime, marked:marked });
  }
  function submitFailed(msg){
    submitting = false;
    $('mSubmitBtn').disabled = false;
    var acts = [{ label:'Retry', cls:'mSubmit', fn:function(){ hideBusy(); doSubmit(lastAuto, lastReason); } }];
    if(!lastAuto) acts.unshift({ label:'Back to test', cls:'mCancel', fn:function(){ hideBusy(); startTicker(); } });
    showBusy(msg || 'Could not submit. Please try again.', acts);
  }

  /* ---------------- review (result + permanent Q-by-Q) ---------------- */
  function renderReview(v, fresh){
    $('introScreen').style.display = 'none'; $('testScreen').style.display = 'none';
    if(timerHandle){ clearInterval(timerHandle); timerHandle = null; }
    if(qtHandle){ clearInterval(qtHandle); qtHandle = null; }
    var byIdx = {};
    (v.answers||[]).forEach(function(a){ if(a && typeof a.questionIndex === 'number') byIdx[a.questionIndex] = a; });
    function sel(i){ var a = byIdx[i]; return (a && a.selectedAnswer != null) ? a.selectedAnswer : null; }
    function wasSeen(i){ var a = byIdx[i]; return !!(a && (a.seen || a.selectedAnswer != null)); }
    // Older attempts saved before per-question timing existed simply have no timeSpentSeconds field —
    // shown as 00:00, never guessed or backfilled.
    function timeOf(i){ var a = byIdx[i]; var s = a && Number(a.timeSpentSeconds); return (isFinite(s) && s>0) ? Math.round(s) : 0; }
    // Same treatment for the bookmark flag: older attempts (or a fresh Practice run where the
    // student never marked anything) simply have no marked question at all — never fabricated.
    function isMarked(i){ var a = byIdx[i]; return !!(a && a.marked); }
    function stateOf(i){
      var s = sel(i);
      if(s == null) return wasSeen(i) ? 'unans' : 'notseen';
      return s === QUESTIONS[i].correct ? 'correct' : 'wrong';
    }
    var out = '';
    var mismatch = (v.answers||[]).length !== N;
    if(fresh){
      out += '<div class="banner" style="background:#0f1f14;border-color:#1f6b3a;color:#4ade80">' +
        (v.kind === 'practice' ? 'Practice result — saved on this device only.' : 'Submitted — your result and review are saved permanently.') + '</div>';
    }
    if(mismatch) out += '<div class="banner">This test may have been changed after this attempt was taken, so some questions might not match the recorded answers.</div>';

    // ---- summary (reuses the authoritative v.score/total/correct/wrong/skipped already computed
    // by computeTestResult() — nothing here recalculates a score) ----
    var pct = (Number(v.total) > 0) ? Math.round((Number(v.score)/Number(v.total))*1000)/10 : null;
    var anyTiming = (v.answers||[]).some(function(a){ return a && a.timeSpentSeconds != null; });
    var totalTime = 0; for(var ti=0; ti<N; ti++) totalTime += timeOf(ti);
    out += '<div class="result"><div class="rmeta">'+h(TITLE)+'</div>';
    if(v.studentName) out += '<div class="rmeta">Student: <b>'+h(v.studentName)+'</b></div>';
    out += '<div class="rmeta">'+h(v.label||'')+(v.submittedAtMs ? ' · '+h(fmtDate(v.submittedAtMs)) : '')+'</div>';
    out += '<div class="score"><span class="score-num">'+num(v.score)+'</span><span class="score-out">/'+num(v.total)+'</span>'+(pct!=null?'<span class="score-div"></span><span class="score-pct">'+pct+'%</span>':'')+'</div>';
    out += '<div class="rstats">' +
      '<div class="rs rs-ok"><div class="rs-top"><span class="rs-ic"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span class="rs-n">'+v.correct+'</span></div><div class="rs-l">Correct</div></div>' +
      '<div class="rs rs-no"><div class="rs-top"><span class="rs-ic"><svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></span><span class="rs-n">'+v.wrong+'</span></div><div class="rs-l">Wrong</div></div>' +
      '<div class="rs rs-un"><div class="rs-top"><span class="rs-ic"><svg viewBox="0 0 24 24"><path d="M6.5 12h11"/></svg></span><span class="rs-n">'+v.skipped+'</span></div><div class="rs-l">Unanswered</div></div>' +
      '</div>';
    out += '<div class="rtime"><svg viewBox="0 0 24 24"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 3h5M12 3v3"/></svg><span>Total active time: '+(anyTiming ? fmtDur(totalTime) : 'Not available') + '</span></div>';
    out += '</div>';

    // ---- filters (display-only: toggles which .sol cards are visible; never touches answers/
    // scoring/timing and never writes anywhere) ----
    out += '<div class="review-filters" id="reviewFilters">' +
      '<button type="button" class="rf active" data-f="all">All</button>' +
      '<button type="button" class="rf" data-f="correct">Correct</button>' +
      '<button type="button" class="rf" data-f="wrong">Incorrect</button>' +
      '<button type="button" class="rf" data-f="unans">Unanswered</button>' +
      '<button type="button" class="rf" data-f="marked">Marked</button>' +
      '</div><div class="empty-filter" id="reviewEmpty" style="display:none">No questions match this filter.</div>';

    out += '<div class="palette" id="rvPalette">';
    for(var i=0;i<N;i++){
      var st = stateOf(i);
      var pc = st==='correct' ? 'rc' : st==='wrong' ? 'rw' : st==='unans' ? 'ru' : 'rn';
      out += '<button class="pb '+pc+(isMarked(i)?' mk':'')+'" data-i="'+i+'">'+(i+1)+(isMarked(i)?'<i class="mkdot"></i>':'')+'</button>';
    }
    out += '</div><div class="legend"><span><i style="background:rgba(34,197,94,.3)"></i>Correct</span><span><i style="background:#ef4444"></i>Wrong</span><span><i style="background:rgba(239,68,68,.12);border-color:#ef4444"></i>Seen, unanswered</span><span><i style="background:#1c2333"></i>Not seen</span></div>';

    QUESTIONS.forEach(function(q, i){
      var st = stateOf(i), s = sel(i), qMarked = isMarked(i);
      var stText = st==='correct' ? 'Correct' :
                   st==='wrong' ? 'Wrong \u2014 your answer: '+KEYS[s]+' \u00b7 correct: '+KEYS[q.correct] :
                   st==='unans' ? 'Unanswered (Seen)' : 'Unanswered (not seen)';
      var b = '<div class="sol '+st+(qMarked?' marked':'')+'" id="rq'+i+'" data-st="'+st+'" data-mk="'+(qMarked?'1':'0')+'">' +
        '<div class="q-num-row"><div class="q-num">Question '+(i+1)+'</div>'+(qMarked?'<span class="markBadge">\u2605 Marked</span>':'')+'</div>';
      if(q.text) b += '<div class="q-text">'+q.text+'</div>';
      if(q.imageUrl) b += '<div class="rq-image"><img src="'+h(q.imageUrl)+'" alt=""><div class="imgerr" style="display:none;font-size:12px;color:#ef4444">Image failed to load</div></div>';
      b += '<div class="st '+st+'">'+stText+'</div>';
      b += '<div class="q-time">Time Spent: '+fmtDur(timeOf(i))+'</div>';
      for(var k=0;k<4;k++){
        var ot = (q.options && q.options[k]) ? q.options[k] : '';
        var oc = 'ropt' + (k===q.correct ? ' correct' : '') + ((s===k && k!==q.correct) ? ' wrongpick' : '');
        var tags = '';
        if(k===q.correct) tags += '<span class="tag ok">Correct answer</span>';
        if(s===k) tags += '<span class="tag '+(k===q.correct?'ok':'no')+'">Your answer</span>';
        b += '<div class="'+oc+'"><div class="key">'+KEYS[k]+'</div><div class="otext">'+ot+'</div>'+tags+'</div>';
      }
      var hasEx = (q.explainText && String(q.explainText).trim()) || (q.explainImageUrl && String(q.explainImageUrl).trim()) || (q.explainUrl && String(q.explainUrl).trim());
      if(hasEx){
        b += '<div class="explain-box"><b>Explanation</b>';
        if(q.explainText) b += '<div>'+q.explainText+'</div>';
        if(q.explainImageUrl) b += '<img src="'+h(q.explainImageUrl)+'" alt=""><div class="imgerr" style="display:none;font-size:12px;color:#ef4444">Image failed to load</div>';
        if(q.explainUrl) b += '<a class="explain-link" href="'+h(q.explainUrl)+'" target="_blank" rel="noopener noreferrer">Open explanation link</a>';
        b += '</div>';
      }
      out += b + '</div>';
    });
    out += '<div class="pdf-actions no-print"><button type="button" class="pdfBtn" id="pdfBtn">\uD83D\uDDA8\uFE0F Save as PDF</button>' +
           '<div class="pdf-hint">Opens your browser/device\u2019s Print dialog — choose "Save as PDF" there.</div></div>';
    var rs = $('reviewScreen');
    rs.innerHTML = out; rs.style.display = 'block';
    // Filters are display-only: they read the data-st/data-mk attributes just written above and
    // toggle visibility. They never touch answers[], scoring, timing, or issue a Firestore call.
    currentApplyReviewFilter = function(f){
      var any = false;
      var cards = rs.querySelectorAll('.sol');
      for(var ci=0; ci<cards.length; ci++){
        var c = cards[ci], st = c.getAttribute('data-st'), mk = c.getAttribute('data-mk') === '1';
        var show = f === 'all' || (f === 'unans' ? (st === 'unans' || st === 'notseen') : (f === 'marked' ? mk : st === f));
        c.style.display = show ? '' : 'none';
        if(show) any = true;
      }
      var rf = $('reviewFilters');
      if(rf){ var btns = rf.querySelectorAll('.rf'); for(var bi=0; bi<btns.length; bi++) btns[bi].classList.toggle('active', btns[bi].getAttribute('data-f') === f); }
      var em = $('reviewEmpty'); if(em) em.style.display = any ? 'none' : 'block';
    };
    window.scrollTo(0,0);
    typeset(rs);
  }

  /* ---------------- pre-publish preview (Admin only) ----------------
     Read-only: no timer, no attempt, no answers, no scoring, nothing saved or submitted. Reuses
     the review screen's own per-question card markup (question/image/options/explanation) so the
     layout matches what a student will eventually see as closely as this shared renderer allows,
     with the correct option and explanation shown up front like an answer key. */
  function renderPreview(){
    $('introScreen').style.display = 'none'; $('testScreen').style.display = 'none';
    var out = '<div class="banner" style="background:#1c2333;border-color:#7f77dd;color:#c9d1d9">\uD83D\uDC41\uFE0F Preview only \u2014 this is not a real attempt. Nothing is saved or submitted.</div>';
    out += '<div class="result"><div class="rmeta">'+h(TITLE)+'</div>';
    if(SUBJECT) out += '<div class="rmeta">'+h(SUBJECT)+'</div>';
    out += '<div class="rmeta">'+N+' question'+(N===1?'':'s')+' \u00b7 +'+num(CORRECT_MARK)+' correct \u00b7 '+num(WRONG_MARK)+' wrong'+(DURATION_MIN>0 ? ' \u00b7 '+DURATION_MIN+' min' : ' \u00b7 no timer')+'</div></div>';
    QUESTIONS.forEach(function(q, i){
      var b = '<div class="sol" id="rq'+i+'"><div class="q-num-row"><div class="q-num">Question '+(i+1)+' of '+N+'</div></div>';
      if(q.text) b += '<div class="q-text">'+q.text+'</div>';
      if(q.imageUrl) b += '<div class="rq-image"><img src="'+h(q.imageUrl)+'" alt=""><div class="imgerr" style="display:none;font-size:12px;color:#ef4444">Image failed to load</div></div>';
      for(var k=0;k<4;k++){
        var ot = (q.options && q.options[k]) ? q.options[k] : '';
        var oc = 'ropt' + (k===q.correct ? ' correct' : '');
        var tags = (k===q.correct) ? '<span class="tag ok">Correct answer</span>' : '';
        b += '<div class="'+oc+'"><div class="key">'+KEYS[k]+'</div><div class="otext">'+ot+'</div>'+tags+'</div>';
      }
      var hasEx = (q.explainText && String(q.explainText).trim()) || (q.explainImageUrl && String(q.explainImageUrl).trim()) || (q.explainUrl && String(q.explainUrl).trim());
      if(hasEx){
        b += '<div class="explain-box"><b>Explanation</b>';
        if(q.explainText) b += '<div>'+q.explainText+'</div>';
        if(q.explainImageUrl) b += '<img src="'+h(q.explainImageUrl)+'" alt=""><div class="imgerr" style="display:none;font-size:12px;color:#ef4444">Image failed to load</div>';
        if(q.explainUrl) b += '<a class="explain-link" href="'+h(q.explainUrl)+'" target="_blank" rel="noopener noreferrer">Open explanation link</a>';
        b += '</div>';
      }
      out += b + '</div>';
    });
    var rs = $('reviewScreen');
    rs.innerHTML = out; rs.style.display = 'block';
    window.scrollTo(0,0);
    typeset(rs);
  }

  /* ---------------- wiring ---------------- */
  $('quizArea').addEventListener('click', function(e){
    if(e.target.closest('[data-mark]')){ toggleMark(); return; }
    var o = e.target.closest('.opt'); if(o) selectOpt(parseInt(o.getAttribute('data-i'),10));
  });
  $('palette').addEventListener('click', function(e){ var b = e.target.closest('.pb'); if(b) jump(parseInt(b.getAttribute('data-i'),10)); });
  $('reviewScreen').addEventListener('click', function(e){
    var p = e.target.closest('#pdfBtn'); if(p){ doPrint(); return; }
    var rfBtn = e.target.closest('.rf'); if(rfBtn){ if(currentApplyReviewFilter) currentApplyReviewFilter(rfBtn.getAttribute('data-f')); return; }
    var b = e.target.closest('.pb'); if(!b) return;
    var t = document.getElementById('rq'+b.getAttribute('data-i')); if(t) t.scrollIntoView({behavior:'smooth', block:'start'});
  });
  $('prevB').onclick = function(){ if(cur>0 && !submitting){ cur--; renderQ(); } };
  $('nextB').onclick = function(){ if(submitting||done) return; if(cur<N-1){ cur++; renderQ(); } else { openConfirm(); } };
  $('mCancelBtn').onclick = function(){ $('confirmModal').classList.remove('open'); };
  $('mSubmitBtn').onclick = function(){ doSubmit(false); };
  $('startBtn').onclick = function(){
    if(started) return;
    if(mode === 'attempt'){
      $('startBtn').disabled = true; $('startBtn').textContent = 'Starting\u2026'; $('startErr').textContent = '';
      post({ type:'start' });
    } else {
      begin({ deadlineMs:0 });
    }
  };
  // A tap inside the test lets the app re-enter fullscreen after a reload (browsers require a user gesture)
  document.addEventListener('pointerup', function(){
    if(!started || done || mode !== 'attempt') return;
    var t = Date.now(); if(t - lastGesture < 1500) return;
    lastGesture = t; post({ type:'gesture' });
  }, true);
  // Per-question timing only: pause the clock while this document is hidden/backgrounded and
  // resume it when it's visible again. Independent of the parent frame's own violation-counting
  // visibility handling (untouched) — this never affects the overall test timer/deadline.
  document.addEventListener('visibilitychange', function(){
    if(document.hidden) timePause(); else timeResume();
  });
  window.addEventListener('message', function(e){
    if(e.source !== window.parent) return;
    var m = e.data; if(!m || m.tms !== 1) return;
    if(m.type === 'started'){ begin({ deadlineMs: m.deadlineMs || 0 }); }
    else if(m.type === 'startFailed'){ $('startBtn').disabled = false; $('startBtn').textContent = 'Start Test'; $('startErr').textContent = m.message || 'Could not start.'; }
    else if(m.type === 'submitted'){ done = true; submitting = false; hideBusy(); renderReview(m.view, true); }
    else if(m.type === 'submitFailed'){ submitFailed(m.message); }
    else if(m.type === 'attemptRemoved'){ submitting = false; done = true; if(timerHandle){ clearInterval(timerHandle); timerHandle = null; } showBusy(m.message || 'This attempt is no longer available.'); }
    else if(m.type === 'autoSubmit'){ $('confirmModal').classList.remove('open'); doSubmit(true, m.reason); }
  });

  if(mode === 'review'){
    renderReview(BOOT.review, false);
  } else if(mode === 'preview'){
    renderPreview();
  } else {
    renderIntro();
    if(BOOT.resume){
      begin(BOOT.resume);
      if(!BOOT.resume.autoSubmit) flash(BOOT.resume.restored ? 'Attempt resumed \u2014 your answers and position were restored.'
                                 : 'Attempt resumed. Saved answers weren\u2019t found on this device, so you are continuing the same attempt with the timer running from its original start.');
    }
  }
}
