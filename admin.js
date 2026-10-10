/* Atomic Minds — ADMIN APP code (Students / Batches / Classes / Notes / Tests / Announcements / Banners / Calendar).
   Moved verbatim out of index.html. It is loaded ON DEMAND by loadAdminCode() the first time an admin screen is
   rendered, so students never download or parse it.
   RULES for this file:
   - Plain classic script (same as tms-player.js): top-level function/let/const share the page's global scope with the
     main script in index.html, so it can use el(), $(), db, STATE, toast(), trackUnsub()... exactly as before.
   - index.html must NEVER reference anything from this file except renderAdminShell() (guarded in renderScreen()).
     If student-side code ever needs a helper that lives here, move that helper into index.html (like contentActive).
   - Top-level declarations only; no code that runs at load time and touches the DOM or Firestore. */
/* ================================================================
   11) ADMIN APP — Students / Classes / Tests / Notes
   ================================================================ */
function renderAdminShell(){
  const shell = el(`<div class="admin-shell">
    <div class="admin-header">
      <div class="admin-header-row">
        <button class="hamburger-btn" id="adminHamburger" aria-label="Menu">${icon('menu',22)}</button>
        ${buildLogo(26)}
        <div style="font-size:14px;font-weight:700;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${BRAND.name} · Admin</div>
        <button class="btn-sm btn-ghost" id="adminLogout" style="flex-shrink:0">${icon('logout',15)}<span>Log out</span></button>
      </div>
    </div>
    <div class="admin-content" id="adminContent"></div>
  </div>`);
  $('#adminHamburger', shell).addEventListener('click', ()=> openAdminDrawer());
  $('#adminLogout', shell).addEventListener('click', doLogout);
  const content = $('#adminContent', shell);
  if(STATE.adminTab === 'home'){
    renderAdminHome(content);
  } else {
    const back = el(`<button class="back-btn">${icon('arrow-left',16)}<span>Dashboard</span></button>`);
    back.addEventListener('click', ()=>{ STATE.adminTab='home'; renderScreen(); });
    content.appendChild(back);
    if(STATE.adminTab==='students') renderAdminStudents(content);
    else if(STATE.adminTab==='batches') renderAdminBatches(content);
    else if(STATE.adminTab==='classes') renderAdminClasses(content);
    else if(STATE.adminTab==='tests') renderAdminTests(content);
    else if(STATE.adminTab==='notes') renderAdminNotes(content);
    else if(STATE.adminTab==='announcements') renderAdminAnnouncements(content);
    else if(STATE.adminTab==='calendar') renderAdminCalendar(content);
    else if(STATE.adminTab==='banners') renderAdminBanners(content);
    else if(STATE.adminTab==='requests') renderAdminUpgradeRequests(content);
  }
  return shell;
}

function openAdminDrawer(){
  openDrawer(BRAND.name + ' · Admin', [
    { key:'home', icon:icon('home'), label:'Dashboard', onSelect:()=>{ STATE.adminTab='home'; renderScreen(); } },
    { key:'students', icon:icon('users'), label:'Students', onSelect:()=>{ STATE.adminTab='students'; renderScreen(); } },
    { key:'batches', icon:icon('layers'), label:'Batches', onSelect:()=>{ STATE.adminTab='batches'; renderScreen(); } },
    { key:'classes', icon:icon('video'), label:'Classes', onSelect:()=>{ STATE.adminTab='classes'; renderScreen(); } },
    { key:'tests', icon:icon('clipboard'), label:'Tests', onSelect:()=>{ STATE.adminTab='tests'; renderScreen(); } },
    { key:'notes', icon:icon('file'), label:'Notes', onSelect:()=>{ STATE.adminTab='notes'; renderScreen(); } },
    { key:'announcements', icon:icon('megaphone'), label:'Announcements', onSelect:()=>{ STATE.adminTab='announcements'; renderScreen(); } },
    { key:'calendar', icon:icon('calendar'), label:'Calendar', onSelect:()=>{ STATE.adminTab='calendar'; renderScreen(); } },
    { key:'banners', icon:icon('image'), label:'Dashboard Banners', onSelect:()=>{ STATE.adminTab='banners'; renderScreen(); } },
    { key:'requests', icon:icon('inbox'), label:'Requests', onSelect:()=>{ STATE.adminTab='requests'; renderScreen(); } },
    { divider:true },
    { key:'logout', icon:icon('logout'), label:'Log out', onSelect: doLogout }
  ], STATE.adminTab);
}

function renderAdminHome(container){
  container.appendChild(el(`
    <div class="home-welcome">
      <div class="hw-title">Welcome, Admin 👋</div>
      <div class="hw-sub">${BRAND.name} control panel</div>
    </div>
  `));
  const grid = el(`
    <div class="home-grid">
      <button class="home-tile" data-t="students"><span class="ht-icon">${icon('users',22)}</span><span class="ht-label">Students</span></button>
      <button class="home-tile" data-t="batches"><span class="ht-icon">${icon('layers',22)}</span><span class="ht-label">Batches</span></button>
      <button class="home-tile" data-t="classes"><span class="ht-icon">${icon('video',22)}</span><span class="ht-label">Classes</span></button>
      <button class="home-tile" data-t="tests"><span class="ht-icon">${icon('clipboard',22)}</span><span class="ht-label">Tests</span></button>
      <button class="home-tile" data-t="notes"><span class="ht-icon">${icon('file',22)}</span><span class="ht-label">Notes</span></button>
      <button class="home-tile" data-t="announcements"><span class="ht-icon">${icon('megaphone',22)}</span><span class="ht-label">Announcements</span></button>
      <button class="home-tile" data-t="calendar"><span class="ht-icon">${icon('calendar',22)}</span><span class="ht-label">Calendar</span></button>
      <button class="home-tile" data-t="banners"><span class="ht-icon">${icon('image',22)}</span><span class="ht-label">Dashboard Banners</span></button>
      <button class="home-tile" data-t="requests" style="position:relative">
        <span class="ht-icon">${icon('inbox',22)}</span><span class="ht-label">Requests</span>
        <span class="ht-badge" id="reqBadge" style="display:none">0</span>
      </button>
    </div>
  `);
  grid.addEventListener('click', e=>{
    const b = e.target.closest('.home-tile'); if(!b) return;
    STATE.adminTab = b.dataset.t;
    renderScreen();
  });
  container.appendChild(grid);
  let batchPending = 0;
  const badge = $('#reqBadge', grid);
  function refreshBadge(){
    if(badge){ badge.style.display = batchPending>0 ? 'block' : 'none'; badge.textContent = batchPending; }
  }
  const unsub2 = db.collection(COL.batchJoinRequests).where('status','==','pending').onSnapshot(snap=>{
    batchPending = 0; snap.forEach(()=>batchPending++); refreshBadge();
  });
  trackUnsub(unsub2);
}

/* Batch-join requests only now — paid-upgrade requests were removed:
   approved batch enrollment already means the student paid the teacher
   directly and was let in, so there was never a separate "paid" state
   left to track once membership stopped gating content (Phase F.5). */
function renderAdminUpgradeRequests(container){
  drawBatchJoinRequests(container);
}


function drawBatchJoinRequests(container){
  const listBox = el(`<div><div class="spinner"></div></div>`);
  container.appendChild(listBox);
  const unsub = db.collection(COL.batchJoinRequests).onSnapshot(snap=>{
    const items = []; snap.forEach(d=> items.push({id:d.id, ...d.data()}));
    items.sort((a,b)=> (a.status==='pending'?0:1) - (b.status==='pending'?0:1));
    listBox.innerHTML = '';
    if(!items.length){ listBox.appendChild(el(`<div class="empty-state"><div class="icon">📚</div>No batch join requests yet.</div>`)); return; }
    items.forEach(r=>{
      const badge = r.status==='pending' ? '<span class="badge badge-accent">⏳ Pending</span>'
        : r.status==='approved' ? '<span class="badge badge-free">✅ Approved</span>'
        : '<span class="badge badge-muted">✕ Rejected</span>';
      const card = el(`<div class="item-card">
        <div class="item-top">
          <div class="item-icon">${r.status==='pending'?'⏳':r.status==='approved'?'✅':'✕'}</div>
          <div class="item-info">
            <div class="item-title">${esc(r.studentName||'Student')}</div>
            <div class="item-meta">Wants to join: ${esc(r.batchName||'Batch')} · ${fmtDate(r.requestedAt)}</div>
            <div class="item-badges">${badge}</div>
          </div>
        </div>
        ${r.status==='pending' ? `<div class="item-actions">
          <button class="btn-sm btn-success" data-act="approve">${icon('check',15)}<span>Approve</span></button>
          <button class="btn-sm btn-danger" data-act="reject">${icon('close',15)}<span>Reject</span></button>
        </div>` : ''}
      </div>`);
      $all('button', card).forEach(b=> b.addEventListener('click', async ()=>{
        try{
          if(b.dataset.act === 'approve'){
            const batchDoc = await db.collection(COL.batches).doc(r.batchId).get();
            const batchData = batchDoc.exists ? batchDoc.data() : { defaultExpiryType:'lifetime', defaultExpiresAt:null };
            const existing = await db.collection(COL.enrollments).where('studentId','==',r.studentId).get();
            let already = false;
            existing.forEach(d=>{ if(d.data().batchId===r.batchId) already = true; });
            if(!already){
              await db.collection(COL.enrollments).add({
                studentId: r.studentId, batchId: r.batchId, batchName: r.batchName,
                status:'active', expiryType: batchData.defaultExpiryType||'lifetime', expiresAt: batchData.defaultExpiresAt||null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              });
              await syncStudentActiveBatchIds(r.studentId);
            }
            await db.collection(COL.batchJoinRequests).doc(r.id).update({ status:'approved' });
            toast(already ? 'Already enrolled — request marked approved' : 'Approved — student enrolled');
          } else if(b.dataset.act === 'reject'){
            await db.collection(COL.batchJoinRequests).doc(r.id).update({ status:'rejected' });
            toast('Request rejected');
          }
        }catch(err){ console.error(err); toast('Action failed — check your connection.'); }
      }));
      listBox.appendChild(card);
    });
  });
  trackUnsub(unsub);
}


let ADMIN_BATCHES = []; // latest Admin → Batches snapshot (read-only cache; no extra Firestore read)
function renderAdminBatches(container){
  container.appendChild(el(`<div>
    <div class="card">
      <div class="card-title">➕ Create batch</div>
      <div class="field"><label>Batch name</label><input id="bName" placeholder="e.g. Class 12 Physics 2026"></div>
      <div class="field"><label>Class (optional — lets students find this batch for their class)</label><input id="bClass" placeholder="e.g. 12"></div>
      <div class="field"><label>Description (optional)</label><textarea id="bDesc" placeholder="What this batch covers..."></textarea></div>
      <div class="field"><label>Default expiry for new enrollments</label></div>
      <div class="expiry-toggle" id="bExpiryToggle">
        <button type="button" class="active" data-v="lifetime">♾ Lifetime</button>
        <button type="button" data-v="fixed">📅 Fixed date</button>
      </div>
      <div class="field" id="bExpiryDateField" style="display:none"><label>Default expiry date</label><input type="date" id="bExpiryDate"></div>
      <button class="btn btn-primary" id="createBatchBtn">💾 Create batch</button>
    </div>
    <div class="card-title" style="margin:14px 0 8px">All batches</div>
    <div id="batchList"><div class="spinner"></div></div>
  </div>`));

  let expiryMode = 'lifetime';
  const toggle = $('#bExpiryToggle', container);
  toggle.addEventListener('click', e=>{
    const b = e.target.closest('button'); if(!b) return;
    expiryMode = b.dataset.v;
    $all('button', toggle).forEach(x=> x.classList.toggle('active', x===b));
    $('#bExpiryDateField', container).style.display = expiryMode==='fixed' ? 'block' : 'none';
  });

  $('#createBatchBtn', container).addEventListener('click', async ()=>{
    const name = $('#bName', container).value.trim();
    if(!name){ toast('Enter a batch name'); return; }
    const expDateVal = $('#bExpiryDate',container).value;
    const defaultExpiresAt = (expiryMode==='fixed' && expDateVal)
      ? firebase.firestore.Timestamp.fromDate(new Date(expDateVal))
      : null;
    await db.collection(COL.batches).add({
      name, class: $('#bClass',container).value.trim(), description: $('#bDesc',container).value.trim(), status:'active',
      defaultExpiryType: expiryMode, defaultExpiresAt,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('Batch created');
    $('#bName',container).value=''; $('#bClass',container).value=''; $('#bDesc',container).value='';
  });

  const listBox = $('#batchList', container);
  const unsub = db.collection(COL.batches).onSnapshot(async snap=>{
    const batches = []; snap.forEach(d=> batches.push({id:d.id, ...d.data()}));
    ADMIN_BATCHES = batches; // in-memory copy of the list this screen already listens to (used by Edit / Copy / Manage Content)
    let counts = {};
    try{
      const enrollSnap = await db.collection(COL.enrollments).get();
      enrollSnap.forEach(d=>{ const e=d.data(); if(e.status==='active') counts[e.batchId]=(counts[e.batchId]||0)+1; });
    }catch(e){ console.error(e); }
    listBox.innerHTML = '';
    if(!batches.length){ listBox.appendChild(el(`<div class="empty-state"><div class="icon">📚</div>No batches yet — create one above.</div>`)); return; }
    batches.forEach(b=>{
      const card = el(`<div class="batch-card">
        <div class="batch-card-top">
          <div><div class="batch-name">${esc(b.name)}</div>${b.description?`<div class="batch-desc">${esc(b.description)}</div>`:''}</div>
          <div class="batch-card-side">
            <span class="badge ${b.status==='active'?'badge-free':'badge-muted'}">${b.status==='active'?'Active':'Archived'}</span>
            <button type="button" class="batch-menu-btn" aria-label="Batch actions">⋮</button>
          </div>
        </div>
        <div class="batch-meta-row">
          ${b.class?`<span class="badge badge-accent">Class ${esc(b.class)}</span>`:''}
          <span class="badge badge-accent">👨‍🎓 ${counts[b.id]||0} enrolled</span>
          <span class="badge badge-muted">${b.defaultExpiryType==='lifetime'?'♾ Lifetime default':'📅 Fixed default'}</span>
        </div>
      </div>`);
      card.addEventListener('click', ()=> openBatchDetail(b));
      $('.batch-menu-btn', card).addEventListener('click', e=>{ e.stopPropagation(); openBatchMenu(b); });
      listBox.appendChild(card);
    });
  });
  trackUnsub(unsub);
}

/* ---------- Batch actions: ⋮ menu → Edit / Copy Batch / Manage Content ----------
   Everything below touches ONLY: batches (create / update metadata) and, for Manage Content, new
   documents in videos / notes / tests. It never reads or writes students, enrollments, activeBatchIds,
   testAttempts, testResults, payments, sessions or any student-owned data, and it adds no listeners
   (the batch list reuses the snapshot Admin → Batches already has — ADMIN_BATCHES). Firestore rules are
   unchanged: batches/videos/notes/tests are already `allow write: if isAdmin()`. */

const BATCH_NAME_MAX = 80;
function batchNameClash(name, exceptId){
  const n = (name||'').trim().toLowerCase();
  return ADMIN_BATCHES.some(b=> b.id !== exceptId && (b.name||'').trim().toLowerCase() === n);
}

/* Rename / basic metadata. Updates the batch document ONLY — the batchId never changes, and no
   enrollment, content, student, progress, attempt, result or payment document is touched. */
async function updateBatchInfo(batchId, f){
  await db.collection(COL.batches).doc(batchId).update({ name: f.name, class: f.class, description: f.description });
}

/* Copy Batch: a NEW batch document (new auto-generated batchId) built from the source batch's
   batch-level metadata only. The source batch is only read, never written. A fixed default expiry
   whose date has already passed is NOT carried over (it would make every new enrollment expired
   on day one) — the copy falls back to Lifetime and says so. */
async function createCopiedBatch(src, name){
  let type = src.defaultExpiryType === 'fixed' ? 'fixed' : 'lifetime';
  let exp = null, expiryReset = false;
  if(type === 'fixed'){
    const ms = tsToMs(src.defaultExpiresAt);
    if(ms != null && ms > Date.now()) exp = src.defaultExpiresAt;
    else { type = 'lifetime'; expiryReset = true; }
  }
  const ref = await db.collection(COL.batches).add({
    name, class: src.class || '', description: src.description || '', status: 'active',
    defaultExpiryType: type, defaultExpiresAt: exp,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return { id: ref.id, expiryReset };
}

function openBatchSheet(innerHtml){
  const ov = el(`<div class="overlay open"><div class="sheet">
    <div class="sheet-handle"></div><button class="sheet-close" type="button" data-close>✕</button><div style="clear:both"></div>
    ${innerHtml}
  </div></div>`);
  document.body.appendChild(ov);
  $('[data-close]', ov).addEventListener('click', ()=> ov.remove());
  return ov;
}

function openBatchMenu(b){
  openActionMenu(b.name || 'Batch', [
    { key:'edit', label:'Edit', icon:'edit' },
    { key:'copy', label:'Copy Batch', icon:'copy' },
    { key:'content', label:'Manage Content', icon:'clipboard' }
  ], key=>{
    if(key === 'edit') openEditBatchSheet(b);
    else if(key === 'copy') openCopyBatchSheet(b);
    else openManageContentSheet(b.id);
  });
}

function openEditBatchSheet(batch){
  const ov = openBatchSheet(`<div class="card">
    <div class="card-title">✏️ Edit batch</div>
    <div class="field"><label>Batch name</label><input id="ebName" maxlength="${BATCH_NAME_MAX}" value="${esc(batch.name||'')}"></div>
    <div class="field"><label>Class (optional)</label><input id="ebClass" value="${esc(batch.class||'')}"></div>
    <div class="field"><label>Description (optional)</label><textarea id="ebDesc">${esc(batch.description||'')}</textarea></div>
    <div class="q-stat-preview">Renaming changes this batch only. Students, enrollments, content, results and the batch ID are not touched, so names already shown on existing content and enrollments stay as they were.</div>
    <button class="btn btn-primary" id="ebSave">💾 Save changes</button>
  </div>`);
  const btn = $('#ebSave', ov);
  btn.addEventListener('click', async ()=>{
    const name = $('#ebName', ov).value.trim();
    if(!name){ toast('Enter a batch name'); return; }
    if(batchNameClash(name, batch.id)){
      const ok = await adminConfirmSheet({ title:'A batch with this name already exists', lines:['Both batches will look identical in lists and dropdowns. Save this name anyway?'], cancel:'Go back', confirm:'Save anyway' });
      if(!ok) return;
    }
    btn.disabled = true;
    try{
      await updateBatchInfo(batch.id, { name, class: $('#ebClass', ov).value.trim(), description: $('#ebDesc', ov).value.trim() });
      toast('Batch updated'); ov.remove();
    }catch(e){ console.error(e); toast('Could not save — check your connection.'); btn.disabled = false; }
  });
}

function openCopyBatchSheet(src){
  const ov = openBatchSheet(`<div class="card">
    <div class="card-title">${icon('copy',16)}<span>Copy Batch</span></div>
    <div class="field"><label>New batch name</label><input id="cbName" maxlength="${BATCH_NAME_MAX}" value="${esc(((src.name||'Batch') + ' — Copy').slice(0, BATCH_NAME_MAX))}"></div>
    <div class="q-stat-preview">Creates a new, separate batch (new batch ID) with this batch's class, description and default expiry. The original batch is not changed.<br>Not copied: students, enrollments, progress, test attempts and results, payments. Classes, notes and tests are not copied here — use ⋮ → Manage Content afterwards.</div>
    <button class="btn btn-primary" id="cbCreate">Create batch</button>
  </div>`);
  const btn = $('#cbCreate', ov);
  btn.addEventListener('click', async ()=>{
    const name = $('#cbName', ov).value.trim();
    if(!name){ toast('Enter a batch name'); return; }
    if(batchNameClash(name, null)){
      const ok = await adminConfirmSheet({ title:'A batch with this name already exists', lines:['Both batches will look identical in lists and dropdowns. Create it anyway?'], cancel:'Go back', confirm:'Create anyway' });
      if(!ok) return;
    }
    btn.disabled = true;
    try{
      const r = await createCopiedBatch(src, name);
      toast(r.expiryReset ? 'Batch created — default expiry set to Lifetime (the old date had passed)' : 'Batch created');
      ov.remove();
    }catch(e){ console.error(e); toast('Could not create — check your connection.'); btn.disabled = false; }
  });
}

/* ---------- Manage Content: copy selected teaching content from one batch to another ----------
   Content docs are flat (batchId + denormalized batchName). A copy is a brand-new document with an
   auto-generated ID, built from an explicit field whitelist (so nothing outside it can leak across),
   with batchId/batchName set to the destination. Values are copied, never referenced, and no source
   id is stored — so editing / deactivating / deleting either side can never touch the other.
   Recorded classes (videos), Notes (incl. study material / assignments — same collection) and Tests are
   offered. Live classes and Calendar schedules are dated events, so they are deliberately not offered. */
const CONTENT_COPY_FIELDS = {
  videos: ['ytId','title','subject','chapter','classNo','duration'],
  notes:  ['title','subject','fileType','downloadable','driveId','driveLink']
};
const TEST_COPY_FIELDS = ['title','subject','type','duration','questionCount','answerButtonLayout',
  'marksPerQuestion','negativeMarksPerQuestion','totalMarks','durationMinutes'];

function pickDefined(src, keys){ const o = {}; keys.forEach(k=>{ if(src[k] !== undefined) o[k] = src[k]; }); return o; }

/* kind: 'videos' | 'notes' | 'tests'; dest: { id, name }. Returns the data for ONE new document. */
function buildContentCopy(kind, src, dest){
  const base = { batchId: dest.id, batchName: dest.id === GENERAL_BATCH_ID ? 'Free Demo' : (dest.name || '') };
  const stamp = firebase.firestore.FieldValue.serverTimestamp();
  if(kind !== 'tests'){
    const c = Object.assign(pickDefined(src, CONTENT_COPY_FIELDS[kind]), base, { createdAt: stamp });
    if(src.active === false) c.active = false;   // a deactivated item stays deactivated in the copy
    return c;
  }
  const d = Object.assign(pickDefined(src, TEST_COPY_FIELDS), base, {
    questions: JSON.parse(JSON.stringify(src.questions)),   // deep copy of the definition only
    source: 'batch-copy', createdAt: stamp
  });
  // Fresh lifecycle: attempts/results live in testAttempts/testResults keyed by the OLD test id, so a new
  // test id starts with none. A Live test is copied WITHOUT the old schedule (liveStartAt/liveEndAt are not
  // carried) and hidden — a Live test with no schedule would otherwise be open to everyone — until the
  // admin sets a new schedule (Tests → Edit) and activates it. Other types keep their visibility.
  if(testKind(src) === 'live') d.active = false;
  else if(src.active === false) d.active = false;
  return d;
}

function contentCopyKey(d){
  return [(d.title||'').trim().toLowerCase(), (d.subject||'').trim().toLowerCase(), d.type || d.fileType || ''].join('|');
}

/* Read-only: ONE get() per collection per side (6 reads in total, no listeners). */
async function loadBatchContentForCopy(srcId, dstId){
  const q = (col, id) => db.collection(col).where('batchId','==',id).get();
  const [sv, sn, st, dv, dn, dt] = await Promise.all([
    q(COL.videos, srcId), q(COL.notes, srcId), q(COL.tests, srcId),
    q(COL.videos, dstId), q(COL.notes, dstId), q(COL.tests, dstId)
  ]);
  const rows = snap => { const a = []; snap.forEach(d=> a.push({ id:d.id, ...d.data() })); a.sort((x,y)=> (tsToMs(x.createdAt)||0) - (tsToMs(y.createdAt)||0)); return a; };
  const keys = snap => { const s = new Set(); snap.forEach(d=> s.add(contentCopyKey(d.data()))); return s; };
  const allTests = rows(st);
  const tests = allTests.filter(t=> Array.isArray(t.questions) && t.questions.length);
  return { videos: rows(sv), notes: rows(sn), tests, skippedTests: allTests.length - tests.length,
           existing: { videos: keys(dv), notes: keys(dn), tests: keys(dt) } };
}

/* Writes ONLY new videos / notes / tests documents. sel = { videos:[], notes:[], tests:[] } of source docs. */
async function copyBatchContent(sel, srcId, dest){
  if(!dest || !dest.id) throw new Error('No destination batch');
  if(dest.id === srcId) throw new Error('Source and destination are the same batch');
  const res = { videos:0, notes:0, tests:0, failed:0, liveHidden:0 };
  const simple = [];
  (sel.videos||[]).forEach(s=> simple.push(['videos', COL.videos, s]));
  (sel.notes||[]).forEach(s=> simple.push(['notes', COL.notes, s]));
  for(let i = 0; i < simple.length; i += 400){
    const chunk = simple.slice(i, i + 400);
    try{
      const wb = db.batch();
      chunk.forEach(([kind, col, s])=> wb.set(db.collection(col).doc(), buildContentCopy(kind, s, dest)));
      await wb.commit();   // atomic per chunk: either every doc in it is created, or none
      chunk.forEach(([kind])=> res[kind]++);
    }catch(e){ console.error(e); res.failed += chunk.length; }
  }
  for(const s of (sel.tests||[])){   // tests can be large (up to ~900 KB), so one write each
    try{
      await db.collection(COL.tests).add(buildContentCopy('tests', s, dest));
      res.tests++; if(testKind(s) === 'live') res.liveHidden++;
    }catch(e){ console.error(e); res.failed++; }
  }
  return res;
}

function openManageContentSheet(presetSourceId){
  const all = [{ id: GENERAL_BATCH_ID, name: 'Free Demo', status: 'active' }].concat(ADMIN_BATCHES);
  const optHtml = (b, sel) => `<option value="${esc(b.id)}"${b.id === sel ? ' selected' : ''}>${esc(b.name || '(unnamed batch)')}${b.status === 'archived' ? ' (archived)' : ''}</option>`;
  const ov = openBatchSheet(`<div class="card">
    <div class="card-title">${icon('clipboard',16)}<span>Manage Content</span></div>
    <div class="q-stat-preview">Copy selected classes, notes and tests from one batch to another. Each copy is independent — editing, deactivating or deleting one never changes the other. Students, enrollments, attempts and results are never copied.</div>
    <div class="field"><label>Open this batch's content</label><div class="tab-filter" style="margin:0"><button type="button" data-go="classes">📹 Classes</button><button type="button" data-go="notes">📄 Notes</button><button type="button" data-go="tests">📋 Tests</button></div></div>
    <div class="field"><label>Source batch</label><select id="mcSrc">${all.map(b=> optHtml(b, presetSourceId)).join('')}</select></div>
    <div class="field"><label>Destination batch</label><select id="mcDst"><option value="">Select destination…</option>${all.filter(b=> b.status !== 'archived').map(b=> optHtml(b, '')).join('')}</select></div>
    <button class="btn btn-ghost" id="mcLoad">Load content</button>
  </div><div id="mcBody"></div>`);
  const body = $('#mcBody', ov), loadBtn = $('#mcLoad', ov);
  // Shortcut into the SAME Published Classes / Notes / Tests screens, pre-filtered to the source batch.
  $all('[data-go]', ov).forEach(btn=> btn.addEventListener('click', ()=>{ const id = $('#mcSrc', ov).value; ov.remove(); openAdminContent(btn.dataset.go, id); }));
  const nameOf = id => (all.find(b=> b.id === id) || {}).name || '';

  loadBtn.addEventListener('click', async ()=>{
    const srcId = $('#mcSrc', ov).value, dstId = $('#mcDst', ov).value;
    if(!srcId || !dstId){ toast('Choose a source and a destination batch'); return; }
    if(srcId === dstId){ toast('Source and destination must be different'); return; }
    loadBtn.disabled = true; body.innerHTML = '<div class="spinner"></div>';
    let data;
    try{ data = await loadBatchContentForCopy(srcId, dstId); }
    catch(e){ console.error(e); body.innerHTML = ''; toast('Could not load — check your connection.'); loadBtn.disabled = false; return; }
    loadBtn.disabled = false;
    renderList(srcId, dstId, data);
  });

  function renderList(srcId, dstId, data){
    const groups = [
      { k:'videos', title:'Recorded Classes', meta: v => v.subject || '' },
      { k:'notes',  title:'Notes & Materials', meta: n => [n.subject, n.fileType].filter(Boolean).join(' · ') },
      { k:'tests',  title:'Tests', meta: t => [t.subject, TEST_KIND_META[testKind(t)].label, t.questionCount || (t.questions||[]).length ? ((t.questionCount || t.questions.length) + ' Qs') : ''].filter(Boolean).join(' · ') }
    ];
    body.innerHTML = '';
    const card = el('<div class="card"></div>');
    groups.forEach(g=>{
      const items = data[g.k];
      const head = el(`<div class="mc-group-title"><span>${g.title} (${items.length})</span>${items.length ? `<button type="button" class="btn-sm btn-ghost" data-all="${g.k}">Select all</button>` : ''}</div>`);
      card.appendChild(head);
      if(!items.length){ card.appendChild(el('<div class="enroll-meta" style="padding:6px 0">None in the source batch.</div>')); return; }
      items.forEach((it, i)=>{
        const dup = data.existing[g.k].has(contentCopyKey(it));
        const live = g.k === 'tests' && testKind(it) === 'live';
        card.appendChild(el(`<label class="mc-row"><input type="checkbox" data-k="${g.k}" data-i="${i}" data-dup="${dup ? 1 : 0}">
          <div class="enroll-info"><div class="enroll-name">${esc(it.title || 'Untitled')}</div>
          <div class="enroll-meta">${esc(g.meta(it))}</div>
          ${dup ? '<div class="enroll-meta" style="color:var(--warning)">Already in destination</div>' : ''}
          ${live ? '<div class="enroll-meta" style="color:var(--warning)">Copied hidden with no schedule — set a new schedule in Tests → Edit, then Activate</div>' : ''}</div></label>`));
      });
    });
    if(data.skippedTests) card.appendChild(el(`<div class="enroll-meta" style="padding:10px 0 0">${data.skippedTests} older test${data.skippedTests === 1 ? '' : 's'} without structured questions can't be copied.</div>`));
    const copyBtn = el('<button class="btn btn-primary" style="margin-top:14px" disabled>Copy 0 selected</button>');
    card.appendChild(copyBtn);
    body.appendChild(card);

    const boxes = () => $all('input[type=checkbox]', card);
    const refreshBtn = () => { const n = boxes().filter(b=> b.checked).length; copyBtn.textContent = 'Copy ' + n + ' selected'; copyBtn.disabled = n === 0; };
    card.addEventListener('change', refreshBtn);
    $all('[data-all]', card).forEach(btn=> btn.addEventListener('click', ()=>{
      const mine = boxes().filter(b=> b.dataset.k === btn.dataset.all && b.dataset.dup !== '1'); // "Select all" skips items already in the destination
      const allOn = mine.length > 0 && mine.every(b=> b.checked);
      mine.forEach(b=> b.checked = !allOn);
      btn.textContent = allOn ? 'Select all' : 'Clear';
      refreshBtn();
    }));

    copyBtn.addEventListener('click', async ()=>{
      const sel = { videos:[], notes:[], tests:[] };
      boxes().filter(b=> b.checked).forEach(b=> sel[b.dataset.k].push(data[b.dataset.k][+b.dataset.i]));
      if(!sel.videos.length && !sel.notes.length && !sel.tests.length) return;
      copyBtn.disabled = true; copyBtn.textContent = 'Copying…';
      let res;
      try{ res = await copyBatchContent(sel, srcId, { id: dstId, name: nameOf(dstId) }); }
      catch(e){ console.error(e); toast('Could not copy — check your connection.'); copyBtn.disabled = false; refreshBtn(); return; }
      const parts = [];
      if(res.videos) parts.push(res.videos + ' recorded class' + (res.videos === 1 ? '' : 'es'));
      if(res.notes) parts.push(res.notes + ' note' + (res.notes === 1 ? '' : 's'));
      if(res.tests) parts.push(res.tests + ' test' + (res.tests === 1 ? '' : 's'));
      body.innerHTML = '';
      body.appendChild(el(`<div class="card"><div class="card-title">${res.failed && !parts.length ? '⚠️ Nothing was copied' : '✅ Copy finished'}</div>
        <div style="font-size:13.5px;line-height:1.5">${parts.length ? 'Copied ' + esc(parts.join(', ')) + ' to ' + esc(nameOf(dstId)) + '.' : ''}</div>
        ${res.liveHidden ? `<div class="enroll-meta" style="margin-top:8px">${res.liveHidden} Live test${res.liveHidden === 1 ? ' was' : 's were'} copied hidden with no schedule — set a new schedule in Tests → Edit, then Activate.</div>` : ''}
        ${res.failed ? `<div class="auth-error" style="display:block;margin-top:10px">${res.failed} item${res.failed === 1 ? '' : 's'} could not be copied. Nothing partial was created for those — you can load the content again and retry.</div>` : ''}
      </div>`));
    });
  }
}


function openBatchDetail(batch){
  const overlay = el(`<div class="overlay open"><div class="sheet">
    <div class="sheet-handle"></div><button class="sheet-close" id="closeBatch">✕</button><div style="clear:both"></div>
    <div class="card">
      <div class="card-title">📚 ${esc(batch.name)}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">${esc(batch.description||'No description')}</div>
      <div class="row2">
        <button class="btn ${batch.status==='active'?'btn-danger':'btn-success'}" id="toggleBatchStatus">${icon(batch.status==='active'?'ban':'check',16)}<span>${batch.status==='active'?'Archive batch':'Reactivate batch'}</span></button>
        <button class="btn btn-ghost" id="deleteBatchBtn">${icon('trash',16)}<span>Delete batch</span></button>
      </div>
    </div>
    <div class="card">
      <div class="card-title">➕ Enroll a student</div>
      <div class="search-input-wrap"><span class="si">${icon('search')}</span><input type="text" id="enrollSearch" placeholder="Search student by name or phone..."></div>
      <div id="enrollSearchResults"></div>
    </div>
    <div class="card">
      <div class="card-title">👨‍🎓 Enrolled students</div>
      <div id="enrollList"><div class="spinner"></div></div>
    </div>
  </div></div>`);
  document.body.appendChild(overlay);
  $('#closeBatch', overlay).addEventListener('click', ()=> overlay.remove());

  $('#toggleBatchStatus', overlay).addEventListener('click', async ()=>{
    await db.collection(COL.batches).doc(batch.id).update({ status: batch.status==='active'?'archived':'active' });
    toast('Updated'); overlay.remove();
  });
  $('#deleteBatchBtn', overlay).addEventListener('click', async ()=>{
    if(!await adminConfirmSheet({ title:'Delete this batch?', lines:['Enrolled students lose this enrollment only — their account, results and payments are untouched.'], cancel:'Cancel', confirm:'Delete' })) return;
    try{
      const enrollSnap = await db.collection(COL.enrollments).where('batchId','==',batch.id).get();
      const affectedStudentIds = []; const dels = [];
      enrollSnap.forEach(d=>{ affectedStudentIds.push(d.data().studentId); dels.push(db.collection(COL.enrollments).doc(d.id).delete()); });
      await Promise.all(dels);
      await db.collection(COL.batches).doc(batch.id).delete();
      await Promise.all(affectedStudentIds.map(id=> syncStudentActiveBatchIds(id)));
      toast('Batch deleted'); overlay.remove();
    }catch(e){ console.error(e); toast('Could not delete — check your connection.'); }
  });

  let allStudents = [];
  db.collection(COL.students).get().then(snap=>{ snap.forEach(d=> allStudents.push({id:d.id, ...d.data()})); }).catch(e=>console.error(e));
  $('#enrollSearch', overlay).addEventListener('input', ()=>{
    const q = $('#enrollSearch',overlay).value.trim().toLowerCase();
    const resultsBox = $('#enrollSearchResults', overlay);
    if(!q){ resultsBox.innerHTML=''; return; }
    const matches = allStudents.filter(s=> (s.fullName||'').toLowerCase().includes(q) || (s.phone||'').includes(q)).slice(0,5);
    resultsBox.innerHTML='';
    matches.forEach(s=>{
      const row = el(`<div class="enroll-row">
        <div class="enroll-info"><div class="enroll-name">${esc(s.fullName)}</div><div class="enroll-meta">${esc(s.phone||'')}</div></div>
        <button class="btn-sm btn-success">+ Enroll</button>
      </div>`);
      $('button', row).addEventListener('click', async ()=>{
        try{
          const existing = await db.collection(COL.enrollments).where('studentId','==',s.id).get();
          let already = false;
          existing.forEach(d=>{ if(d.data().batchId===batch.id) already = true; });
          if(already){ toast('Already enrolled'); return; }
          await db.collection(COL.enrollments).add({
            studentId: s.id, batchId: batch.id, batchName: batch.name,
            status:'active', expiryType: batch.defaultExpiryType||'lifetime', expiresAt: batch.defaultExpiresAt||null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          await syncStudentActiveBatchIds(s.id);
          toast('Enrolled ' + s.fullName);
          $('#enrollSearch',overlay).value=''; resultsBox.innerHTML='';
        }catch(e){ console.error(e); toast('Could not enroll — check your connection.'); }
      });
      resultsBox.appendChild(row);
    });
  });

  const enrollListBox = $('#enrollList', overlay);
  const unsub = db.collection(COL.enrollments).where('batchId','==',batch.id).onSnapshot(async snap=>{
    const items = []; snap.forEach(d=> items.push({id:d.id, ...d.data()}));
    enrollListBox.innerHTML = '';
    if(!items.length){ enrollListBox.appendChild(el(`<div class="empty-state">No students enrolled yet.</div>`)); return; }
    for(const e of items){
      let sName = e.studentName || 'Student';
      try{ const sDoc = await db.collection(COL.students).doc(e.studentId).get(); if(sDoc.exists) sName = sDoc.data().fullName; }catch(err){}
      // The batch page is already scoped to one batch: no per-student validity, and no "Active" badge on
      // every row — only an exceptional state (Suspended / Expired) is flagged, next to the name.
      const statusBadge = e.status==='active' ? ''
        : e.status==='suspended' ? '<span class="badge badge-suspended" style="margin-left:6px;vertical-align:middle">Suspended</span>'
        : '<span class="badge badge-expired" style="margin-left:6px;vertical-align:middle">Expired</span>';
      const row = el(`<div class="enroll-row enroll-wrap">
        <div class="enroll-info"><div class="enroll-name">${esc(sName)}${statusBadge}</div></div>
      </div>`);
      const actions = el(`<div class="item-actions">
        <button class="btn-sm btn-ghost" data-act="toggle">${icon(e.status==='active'?'pause':'play',15)}<span>${e.status==='active'?'Suspend':'Reactivate'}</span></button>
        <button class="btn-sm btn-danger" data-act="remove">${icon('trash',15)}<span>Remove</span></button>
      </div>`);
      $all('button', actions).forEach(b=> b.addEventListener('click', async ()=>{
        try{
          if(b.dataset.act==='toggle'){
            await db.collection(COL.enrollments).doc(e.id).update({ status: e.status==='active'?'suspended':'active', updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            await syncStudentActiveBatchIds(e.studentId);
            toast('Updated');
          } else if(b.dataset.act==='remove'){
            await db.collection(COL.enrollments).doc(e.id).delete();
            await syncStudentActiveBatchIds(e.studentId);
            toast('Removed from batch');
          }
        }catch(err){ console.error(err); toast('Action failed — check your connection.'); }
      }));
      row.appendChild(actions);
      enrollListBox.appendChild(row);
    }
  });
  trackUnsub(unsub);
}

function renderAdminStudents(container){
  container.appendChild(el(`<div class="search-input-wrap"><span class="si">🔍</span><input type="text" id="stuSearch" placeholder="Search by name or phone..."></div>`));
  const listBox = el(`<div><div class="spinner"></div></div>`);
  container.appendChild(listBox);
  let all = [];
  let batchCounts = {};
  const unsub = db.collection(COL.students).onSnapshot(snap=>{
    all=[]; snap.forEach(d=>all.push({id:d.id,...d.data()}));
    all.sort((a,b)=>(a.fullName||'').localeCompare(b.fullName||''));
    apply();
  });
  trackUnsub(unsub);
  const unsub2 = db.collection(COL.enrollments).onSnapshot(snap=>{
    batchCounts = {};
    snap.forEach(d=>{ const e=d.data(); if(e.status==='active') batchCounts[e.studentId]=(batchCounts[e.studentId]||0)+1; });
    apply();
  });
  trackUnsub(unsub2);
  $('#stuSearch',container).addEventListener('input', apply);
  function apply(){
    const q = ($('#stuSearch',container)?.value||'').toLowerCase();
    const filtered = all.filter(s=> !q || (s.fullName||'').toLowerCase().includes(q) || (s.phone||'').includes(q));
    listBox.innerHTML='';
    if(!filtered.length){ listBox.appendChild(el(`<div class="empty-state"><div class="icon">👨‍🎓</div>No students found.</div>`)); return; }
    filtered.forEach(s=>{
      const initials = (s.fullName||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      const n = batchCounts[s.id]||0;
      const card = el(`
        <div class="item-card tap-card">
          <div class="item-top">
            <div class="item-icon">${esc(initials)}</div>
            <div class="item-info">
              <div class="item-title">${esc(s.fullName)}</div>
              <div class="item-meta">${esc(s.phone||'')}</div>
              <div class="item-badges">
                <span class="badge ${n>0?'badge-accent':'badge-muted'}">📚 ${n>0?(n+' batch'+(n>1?'es':'')):'No batch'}</span>
                ${s.active===false?`<span class="badge badge-muted" ${s.deactivationReason?`title="${esc(s.deactivationReason)}"`:''}>Deactivated</span>`:''}
              </div>
            </div>
          </div>
        </div>`);
      card.addEventListener('click', ()=> openStudentDetail(s));
      listBox.appendChild(card);
    });
  }
}

/* ================================================================
   PERMANENT STUDENT DELETE (admin-only)
   ----------------------------------------------------------------
   Deletes only data OWNED by this one student — never shared teaching
   content (batches/videos/liveClasses/notes/tests/classSchedules/
   classScheduleRules/announcements). The collections below are every
   place in this repo that stores a document keyed by studentId or
   nested under students/{id} (payments) — see COL and the studentId
   grep across index.html/firestore.rules. All existing Security Rules
   for these collections already permit admin delete (allow write /
   allow update, delete: if isAdmin()) — nothing needed changing there.

   Order matters:
   1) Release the device/session lock first (same fields "Reset
      device" already clears) — reuses the existing session-cleanup
      shape rather than inventing a new one.
   2) Delete every OTHER student-owned collection, batched and chunked
      (Firestore's batch limit is 500 ops; 450 leaves headroom).
   3) Delete students/{id} itself LAST. If anything above throws, the
      student doc is still there — visible in the admin list, safely
      retryable — instead of the student silently vanishing from the
      list while orphaned data is left behind.

   This never touches Firebase Authentication (Spark/client-only — see
   the caller for the "Auth account still present" notice) and never
   attempts to auto-recreate a deleted profile — see the
   !studentDoc.exists branch in onAuthStateChanged.
   ================================================================ */
async function permanentlyDeleteStudent(studentId){
  try{
    await db.collection(COL.students).doc(studentId).update({
      deviceId: '', activeSessionId: '', activeDeviceId: '', sessionStartedAt: null
    });
  }catch(e){ console.error('[delete-student] session release failed (continuing):', e); }

  async function deleteAllByQuery(query){
    const snap = await query.get();
    const refs = snap.docs.map(d=>d.ref);
    for(let i=0; i<refs.length; i+=450){
      const batch = db.batch();
      refs.slice(i, i+450).forEach(r=> batch.delete(r));
      await batch.commit();
    }
  }

  await deleteAllByQuery(db.collection(COL.students).doc(studentId).collection(COL.payments));
  await deleteAllByQuery(db.collection(COL.enrollments).where('studentId','==',studentId));
  await deleteAllByQuery(db.collection(COL.testResults).where('studentId','==',studentId));
  await deleteAllByQuery(db.collection(COL.testAttempts).where('studentId','==',studentId));
  await deleteAllByQuery(db.collection(COL.upgradeRequests).where('studentId','==',studentId));
  await deleteAllByQuery(db.collection(COL.batchJoinRequests).where('studentId','==',studentId));

  await db.collection(COL.students).doc(studentId).delete();
}

function openStudentDetail(s){
  const overlay = el(`<div class="overlay open"><div class="sheet">
    <div class="sheet-handle"></div><button class="sheet-close" id="closeDetail" aria-label="Close">${icon('close')}</button><div style="clear:both"></div>
    <div class="card">
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:10px">${esc(s.email||'')}</div>
      <div class="field"><label>Full Name</label><input id="sdFullName" type="text" value="${esc(s.fullName||'')}" placeholder="e.g. Virat Kohli" disabled></div>
      <div class="field"><label>Phone Number</label><input id="sdPhone" type="tel" value="${esc(s.phone||'')}" placeholder="10-digit mobile number" disabled></div>
      <div class="field"><label>Class</label><input id="sdClass" type="text" value="${esc(s.class||'')}" disabled></div>
      <div class="field"><label>School</label><input id="sdSchool" type="text" value="${esc(s.school||'')}" disabled></div>
      <div class="row2">
        <div class="field"><label>Parent/Guardian Name</label><input id="sdGName" type="text" value="${esc(s.guardianName||'')}" disabled></div>
        <div class="field"><label>Parent/Guardian Phone</label><input id="sdGPhone" type="tel" value="${esc(s.guardianPhone||'')}" disabled></div>
      </div>
      <div class="field"><label>Date of Birth</label><input id="sdDob" type="date" value="${esc(s.dob||'')}" disabled></div>
      <div class="field"><label>Address</label><textarea id="sdAddress" placeholder="House/street, area" disabled>${esc(s.address||'')}</textarea></div>
      <div style="font-size:12px;color:var(--text-muted);margin:2px 0 10px">Watch time: <b style="color:var(--text)">${Math.round(s.watchMinutes||0)} mins</b></div>
      <div id="sdErr" style="display:none;color:var(--danger);font-size:12px;margin-bottom:8px"></div>
      <button class="btn btn-primary" id="sdSaveBtn" style="width:100%">✏️ Edit</button>
      <div class="row2" style="margin-top:12px">
        <button class="btn ${s.active===false?'btn-success':'btn-danger'}" id="toggleActive">${icon(s.active===false?'check':'ban',16)}<span>${s.active===false?'Activate':'Deactivate'}</span></button>
        <button class="btn btn-ghost" id="resetDevice">${icon('refresh',16)}<span>Reset device</span></button>
      </div>
      <button class="btn btn-danger" id="permDelete" style="width:100%;margin-top:10px;border-top:1px dashed var(--danger-brd);padding-top:12px">${icon('trash',16)}<span>Permanent Delete</span></button>
      ${s.active===false && s.deactivationReason ? `<div style="background:var(--danger-bg);border:1px solid var(--danger-brd);color:var(--danger);font-size:12px;padding:8px 10px;border-radius:8px;margin-top:10px"><b>Reason:</b> ${esc(s.deactivationReason)}</div>` : ''}
    </div>
    <div class="card">
      <div class="card-title">${icon('layers')}<span>Batches</span></div>
      <div id="detailEnrollList"><div class="spinner"></div></div>
      <div style="margin-top:10px">
        <div class="search-input-wrap" style="margin-bottom:6px"><span class="si">${icon('search')}</span><input type="text" id="detailBatchSearch" placeholder="Search a batch to enroll into..."></div>
        <div id="detailBatchResults"></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">${icon('money')}<span>Payment history</span></div>
      <div id="detailPayments"></div>
      <div class="field" style="margin-top:10px"><label>Description</label><input type="text" id="payDesc" placeholder="e.g. March fee"></div>
      <div class="row2">
        <div class="field"><label>Amount ₹</label><input type="number" id="payAmt" placeholder="0" inputmode="decimal"></div>
        <div class="field"><label>Status</label><select id="payStatus"><option>Paid</option><option>Pending</option></select></div>
      </div>
      <div class="field"><label>Payment method</label><select id="payMode"><option>Cash</option><option>UPI</option><option>Bank Transfer</option></select></div>
      <button class="btn btn-primary" id="addPayment" style="margin-top:2px">${icon('plus',16)}<span>Add Payment</span></button>
    </div>
  </div></div>`);
  document.body.appendChild(overlay);
  let enrollUnsub = null;
  $('#closeDetail', overlay).addEventListener('click', ()=>{ if(enrollUnsub) enrollUnsub(); overlay.remove(); });
  // Fields open only after an explicit Edit tap (same pattern as the student's own profile screen) —
  // the button then becomes Save Changes for that same tap-to-save action, and reverts to disabled +
  // Edit once the save succeeds, since this sheet stays open rather than re-rendering.
  const sdEditableIds = ['sdFullName','sdPhone','sdClass','sdSchool','sdGName','sdGPhone','sdDob','sdAddress'];
  let sdEditing = false;
  $('#sdSaveBtn', overlay).addEventListener('click', async ()=>{
    const btn = $('#sdSaveBtn', overlay);
    if(!sdEditing){
      sdEditing = true;
      sdEditableIds.forEach(id => { const f = $('#'+id, overlay); if(f) f.disabled = false; });
      btn.textContent = '💾 Save Changes';
      const first = $('#sdFullName', overlay); if(first) first.focus();
      return;
    }
    const errBox = $('#sdErr', overlay);
    errBox.style.display = 'none';
    const showErr = msg => { errBox.textContent = msg; errBox.style.display = ''; };
    const nameCheck = validateFullName($('#sdFullName', overlay).value);
    if(!nameCheck.ok){ showErr(nameCheck.error); return; }
    const phoneCheck = validateIndianMobile($('#sdPhone', overlay).value);
    if(!phoneCheck.ok){ showErr(phoneCheck.error); return; }
    const gPhoneCheck = validateIndianMobile($('#sdGPhone', overlay).value, {optional:true});
    if(!gPhoneCheck.ok){ showErr('Guardian phone: ' + gPhoneCheck.error); return; }
    const updates = {
      fullName: nameCheck.value,
      phone: phoneCheck.value,
      class: $('#sdClass', overlay).value.trim(),
      school: $('#sdSchool', overlay).value.trim(),
      guardianName: $('#sdGName', overlay).value.trim(),
      guardianPhone: gPhoneCheck.value,
      dob: $('#sdDob', overlay).value,
      address: $('#sdAddress', overlay).value.trim(),
    };
    btn.disabled = true; btn.textContent = 'Saving…';
    try{
      await db.collection(COL.students).doc(s.id).update(updates);
      Object.assign(s, updates);
      toast('Student details updated');
      sdEditing = false;
      sdEditableIds.forEach(id => { const f = $('#'+id, overlay); if(f) f.disabled = true; });
      btn.disabled = false; btn.textContent = '✏️ Edit';
    }catch(err){
      console.error(err);
      btn.disabled = false; btn.textContent = '💾 Save Changes';
      showErr('Could not save — check your connection and try again.');
    }
  });
  $('#toggleActive', overlay).addEventListener('click', async ()=>{
    if(s.active===false){
      // Re-activating — just clear the flag and any old reason.
      await db.collection(COL.students).doc(s.id).update({ active: true, deactivationReason: '' });
      toast('Student activated');
    } else {
      // Deactivating — a reason is mandatory so it can be shown to the
      // student on their next login attempt and to any admin looking at
      // this profile later.
      const reason = prompt('Reason for deactivating this student (required):');
      if(reason === null) return; // cancelled
      const trimmed = reason.trim();
      if(!trimmed){
        toast('A reason is required to deactivate a student.');
        return;
      }
      await db.collection(COL.students).doc(s.id).update({ active: false, deactivationReason: trimmed });
      toast('Student deactivated');
    }
    if(enrollUnsub) enrollUnsub(); overlay.remove();
  });
  $('#resetDevice', overlay).addEventListener('click', async ()=>{
    await db.collection(COL.students).doc(s.id).update({
      deviceId: '',
      activeSessionId: '',
      activeDeviceId: '',
      sessionStartedAt: null
    });
    toast('Device reset — student can log in on a new device now.');
  });
  $('#permDelete', overlay).addEventListener('click', async ()=>{
    if(!await adminConfirmSheet({ title:'Are you sure you want to permanently delete this student?', cancel:'Cancel', confirm:'Delete' })) return;
    if(!await adminConfirmSheet({ title:'All student-specific TMS data will be permanently deleted.', lines:['This action cannot be undone.'], cancel:'Cancel', confirm:'Delete permanently' })) return;
    const btn = $('#permDelete', overlay);
    btn.disabled = true; btn.textContent = 'Deleting...';
    try{
      await permanentlyDeleteStudent(s.id);
      toast('Student data permanently deleted.');
      // The Firebase Auth account is client-side-only and untouched — see
      // the "Do NOT attempt to delete the Firebase Authentication account"
      // requirement. If that old login is used again, onAuthStateChanged's
      // !studentDoc.exists branch rejects it without recreating a profile.
      alert('Student data deleted successfully.\n\nNote: The Firebase Authentication account is still present. If required, delete the Auth account manually from Firebase Console.');
      if(enrollUnsub) enrollUnsub();
      overlay.remove();
    }catch(e){
      console.error('[delete-student] failed:', e);
      toast('Could not delete student — check your connection and try again.');
      btn.disabled = false; btn.innerHTML = icon('trash',16)+'<span>Permanent Delete</span>';
    }
  });

  // ---- Batches card: live list of this student's enrollments + search-to-enroll ----
  const enrollListBox = $('#detailEnrollList', overlay);
  enrollUnsub = db.collection(COL.enrollments).where('studentId','==',s.id).onSnapshot(snap=>{
    const items = []; snap.forEach(d=> items.push({id:d.id, ...d.data()}));
    enrollListBox.innerHTML = '';
    if(!items.length){ enrollListBox.appendChild(el(`<div class="empty-state" style="padding:14px 0">No batches assigned yet.</div>`)); return; }
    items.forEach(e=>{
      const expTxt = e.expiryType==='lifetime' ? 'Lifetime' : ('Expires ' + fmtDate(e.expiresAt));
      // "Active" is the normal state and the Suspend/Reactivate button already says which it is, so only an
      // exceptional state (Suspended / Expired) gets a badge.
      const statusBadge = e.status==='active' ? ''
        : e.status==='suspended' ? '<span class="badge badge-suspended" style="margin-left:6px;vertical-align:middle">Suspended</span>'
        : '<span class="badge badge-expired" style="margin-left:6px;vertical-align:middle">Expired</span>';
      const row = el(`<div class="enroll-row enroll-wrap">
        <div class="enroll-info"><div class="enroll-name">${esc(e.batchName||'Batch')}${statusBadge}</div><div class="enroll-meta">${esc(expTxt)}</div></div>
      </div>`);
      const actions = el(`<div class="item-actions">
        <button class="btn-sm btn-ghost" data-act="toggle">${icon(e.status==='active'?'pause':'play',15)}<span>${e.status==='active'?'Suspend':'Reactivate'}</span></button>
        <button class="btn-sm btn-danger" data-act="remove">${icon('trash',15)}<span>Remove</span></button>
      </div>`);
      $all('button', actions).forEach(b=> b.addEventListener('click', async ()=>{
        try{
          if(b.dataset.act==='toggle'){
            await db.collection(COL.enrollments).doc(e.id).update({ status: e.status==='active'?'suspended':'active', updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            await syncStudentActiveBatchIds(e.studentId);
            toast('Updated');
          } else if(b.dataset.act==='remove'){
            await db.collection(COL.enrollments).doc(e.id).delete();
            await syncStudentActiveBatchIds(e.studentId);
            toast('Removed from batch');
          }
        }catch(err){ console.error(err); toast('Action failed — check your connection.'); }
      }));
      row.appendChild(actions);
      enrollListBox.appendChild(row);
    });
  });

  let allBatches = [];
  db.collection(COL.batches).where('status','==','active').get().then(snap=>{ snap.forEach(d=> allBatches.push({id:d.id, ...d.data()})); }).catch(e=>console.error(e));
  $('#detailBatchSearch', overlay).addEventListener('input', ()=>{
    const q = $('#detailBatchSearch',overlay).value.trim().toLowerCase();
    const resultsBox = $('#detailBatchResults', overlay);
    if(!q){ resultsBox.innerHTML=''; return; }
    const matches = allBatches.filter(b=> (b.name||'').toLowerCase().includes(q)).slice(0,5);
    resultsBox.innerHTML='';
    matches.forEach(b=>{
      const row = el(`<div class="enroll-row">
        <div class="enroll-info"><div class="enroll-name">${esc(b.name)}</div></div>
        <button class="btn-sm btn-success">+ Enroll</button>
      </div>`);
      $('button', row).addEventListener('click', async ()=>{
        try{
          const existing = await db.collection(COL.enrollments).where('studentId','==',s.id).get();
          let already = false;
          existing.forEach(d=>{ if(d.data().batchId===b.id) already = true; });
          if(already){ toast('Already in this batch'); return; }
          await db.collection(COL.enrollments).add({
            studentId: s.id, batchId: b.id, batchName: b.name,
            status:'active', expiryType: b.defaultExpiryType||'lifetime', expiresAt: b.defaultExpiresAt||null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          await syncStudentActiveBatchIds(s.id);
          toast('Enrolled into ' + b.name);
          $('#detailBatchSearch',overlay).value=''; resultsBox.innerHTML='';
        }catch(err){ console.error(err); toast('Could not enroll — check your connection.'); }
      });
      resultsBox.appendChild(row);
    });
  });

  const payBox = $('#detailPayments', overlay);
  db.collection(COL.students).doc(s.id).collection(COL.payments).orderBy('date','desc').get().then(snap=>{
    if(snap.empty){ payBox.innerHTML='<div style="font-size:11px;color:var(--text-dim)">No payments yet.</div>'; return; }
    payBox.innerHTML='';
    snap.forEach(d=>{
      const pay = d.data();
      payBox.appendChild(el(`<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:11px;padding:5px 0;border-bottom:1px solid var(--border-soft)">
        <span style="min-width:0">${esc(pay.description||'')} · ${fmtDate(pay.date)}</span><span style="flex-shrink:0">₹${esc(pay.amount||0)} · ${esc(pay.status||'')}</span></div>`));
    });
  });
  $('#addPayment', overlay).addEventListener('click', async ()=>{
    const desc = $('#payDesc',overlay).value.trim();
    const amt = parseFloat($('#payAmt',overlay).value);
    if(!desc || !amt){ toast('Fill description and amount'); return; }
    await db.collection(COL.students).doc(s.id).collection(COL.payments).add({
      description: desc, amount: amt, status: $('#payStatus',overlay).value, mode: $('#payMode',overlay).value,
      date: firebase.firestore.Timestamp.now()
    });
    toast('Payment added'); if(enrollUnsub) enrollUnsub(); overlay.remove();
  });
}

function ytIdFromUrl(url){
  const m = (url||'').match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : (url||'').trim();
}

/* ================================================================
   ADMIN — Published Classes / Published Notes (+ batch filter, shared with Published Tests)
   ----------------------------------------------------------------
   ONE implementation — renderPublishedContentSection() — drives Published Classes (recorded + live)
   and Published Notes; each is described by a small config (VIDEO_CFG / LIVE_CFG / NOTE_CFG). Published
   Tests keeps its own renderer and shares only the batch-filter helpers and the ⋮ menu below.
   Batch filtering is by canonical batchId (never by the visible name), against the ONE snapshot each list
   already had (no new listener, no extra reads). The selected batch (ADMIN_CONTENT_BATCH) is shared by
   Published Classes / Notes / Tests so the batch context stays the same while moving between them, and
   Batches → ⋮ → Manage Content can open any of them already filtered to that batch.
   Deactivate/Activate reuses the Tests/Announcements idiom: an `active` field where a missing value means
   active; students' lists hide `active === false` (see contentActive()). No rule or schema change.
   Free Demo (batchId '__general__') is shown only under Free Demo / All Batches and carries a small
   "all batches" label, because students of every batch see it.
   ================================================================ */
let ADMIN_CONTENT_BATCH = '';        // '' = All Batches; otherwise a canonical batchId
let ADMIN_CLASS_KIND = 'recorded';   // Published Classes: 'recorded' | 'live'
const ADMIN_BATCH_NAMES = new Map(); // batchId -> last seen display name (so a selected batch keeps its name even with no content)

function openAdminContent(tab, batchId){ ADMIN_CONTENT_BATCH = batchId || ''; STATE.adminTab = tab; renderScreen(); }
function sharedBadge(x){ return x.batchId === GENERAL_BATCH_ID ? '<span class="badge badge-accent">🎁 Free Demo · all batches</span>' : ''; }

/* <option> list for a Batch filter: "All Batches" + every batch that has at least one of `items`
   + the currently selected batch even if it has none (so selecting a batch never silently flips to All). */
function batchFilterOptions(items, selectedId){
  const list = uniqueBatchesFromTests(items);
  list.forEach(b=> ADMIN_BATCH_NAMES.set(b.id, b.name));
  ADMIN_BATCHES.forEach(b=> { if(!ADMIN_BATCH_NAMES.has(b.id)) ADMIN_BATCH_NAMES.set(b.id, b.name || b.id); });
  if(selectedId && !list.some(b=> b.id === selectedId)){
    list.push({ id: selectedId, name: selectedId === GENERAL_BATCH_ID ? 'Free Demo' : (ADMIN_BATCH_NAMES.get(selectedId) || selectedId) });
    list.sort((a,b)=> a.name.localeCompare(b.name));
  }
  return '<option value="">All Batches</option>' + list.map(b=> `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('');
}

/* Compact centered ⋮ menu (secondary / destructive actions). items: [{key,label,icon|iconHtml,danger}] */
function openActionMenu(title, items, onSelect){
  const ov = el(`<div class="overlay open" style="align-items:center;z-index:1200"><div class="sheet" style="border-radius:16px;max-width:320px;padding:14px;transform:none">
    <div style="font-size:14px;font-weight:700;margin:2px 4px 10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(title || '')}</div>
    ${items.map(i=> `<button type="button" class="btn btn-ghost batch-menu-item${i.danger ? ' danger' : ''}" data-a="${esc(i.key)}">${i.iconHtml || icon(i.icon,16)}<span>${esc(i.label)}</span></button>`).join('')}
  </div></div>`);
  document.body.appendChild(ov);
  ov.addEventListener('click', e=>{
    if(e.target === ov){ ov.remove(); return; }
    const b = e.target.closest('[data-a]'); if(!b) return;
    ov.remove(); onSelect(b.dataset.a);
  });
}

/* Edit sheet for ONE existing content document: updates that document in place (never creates one, never
   touches batchId/batchName or any other collection). cfg.editFields(item) → [{k,label,value,type?,options?,placeholder?}];
   cfg.buildUpdate(values, item) → { error } or { update }. */
function openContentEditSheet(cfg, item){
  const rows = cfg.editFields(item).map(f=>{
    const v = f.value == null ? '' : f.value;
    const ctl = f.options
      ? `<select data-f="${esc(f.k)}">${f.options.map(o=> `<option value="${esc(o.v)}"${String(o.v) === String(v) ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`
      : `<input data-f="${esc(f.k)}" type="${f.type || 'text'}" value="${esc(v)}"${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ''}>`;
    return `<div class="field"><label>${esc(f.label)}</label>${ctl}</div>`;
  }).join('');
  const ov = openBatchSheet(`<div class="card">
    <div class="card-title">✏️ Edit ${esc(cfg.noun)}</div>${rows}
    <div class="q-stat-preview">Updates this ${esc(cfg.noun)} only. Its batch and all student data stay as they are.</div>
    <button class="btn btn-primary" data-save type="button">💾 Save changes</button>
  </div>`);
  const btn = $('[data-save]', ov);
  btn.addEventListener('click', async ()=>{
    const vals = {}; $all('[data-f]', ov).forEach(i=>{ vals[i.dataset.f] = i.value.trim(); });
    const r = cfg.buildUpdate(vals, item);
    if(r.error){ toast(r.error); return; }
    btn.disabled = true;
    try{
      await db.collection(cfg.col).doc(item.id).update(Object.assign({}, r.update, { updatedAt: firebase.firestore.FieldValue.serverTimestamp() }));
      toast('Saved'); ov.remove();
    }catch(e){ console.error(e); toast('Could not save — check your connection.'); btn.disabled = false; }
  });
}

const VIDEO_CFG = {
  col: 'videos', noun: 'class', nouns: 'classes', emptyIcon: '🎬', emptyText: 'No recorded classes published yet.',
  icon: v=> '▶️',
  meta: v=> [v.subject, v.classNo ? 'Class ' + v.classNo : '', v.chapter, v.duration].filter(Boolean).join(' · '),
  editFields: v=> [
    { k:'title', label:'Title', value:v.title }, { k:'subject', label:'Subject', value:v.subject },
    { k:'chapter', label:'Chapter', value:v.chapter }, { k:'classNo', label:'Class no.', value:v.classNo },
    { k:'duration', label:'Duration', value:v.duration },
    { k:'url', label:'YouTube link', value: v.ytId ? 'https://youtu.be/' + v.ytId : '' }
  ],
  buildUpdate: (f)=>{
    if(!f.title) return { error:'Enter a title' };
    const ytId = ytIdFromUrl(f.url); if(!ytId) return { error:'Enter the YouTube link' };
    return { update:{ title:f.title, subject:f.subject, chapter:f.chapter, classNo:f.classNo, duration:f.duration, ytId } };
  },
  extraMenu: ()=> []
};
const LIVE_CFG = {
  col: 'liveClasses', noun: 'live class', nouns: 'live classes', emptyIcon: '📅', emptyText: 'No live classes scheduled yet.',
  icon: lc=> lc.status === 'live' ? '🔴' : lc.status === 'ended' ? '✅' : '📅',
  meta: lc=> [lc.subject, lc.date, lc.time].filter(Boolean).join(' · '),
  badges: lc=> `<span class="badge ${lc.status === 'live' ? 'badge-live' : 'badge-muted'}">${esc(lc.status || 'upcoming')}</span>`,
  editFields: lc=> [
    { k:'title', label:'Title', value:lc.title }, { k:'subject', label:'Subject', value:lc.subject },
    { k:'meetLink', label:'Google Meet link', value:lc.meetLink },
    { k:'date', label:'Date', value:lc.date, type:'date' }, { k:'time', label:'Time', value:lc.time, type:'time' }
  ],
  buildUpdate: (f)=>{
    if(!f.title) return { error:'Enter a title' };
    if(!f.meetLink) return { error:'Enter the Google Meet link' };
    return { update:{ title:f.title, subject:f.subject, meetLink:f.meetLink, date:f.date, time:f.time } };
  },
  extraMenu: lc=> [
    { key:'status:live',  label:'Mark Live',  iconHtml:'🔴' },
    { key:'status:ended', label:'Mark Ended', icon:'check' }
  ]
};
const NOTE_CFG = {
  col: 'notes', noun: 'note', nouns: 'notes', emptyIcon: '📄', emptyText: 'No notes or assignments published yet.',
  icon: n=> n.fileType === 'assignment' ? '📝' : n.downloadable ? '📥' : '🔒',
  meta: n=> n.subject || '',
  badges: n=> `<span class="badge ${n.downloadable ? 'badge-free' : 'badge-paid'}">${n.downloadable ? 'Downloadable' : 'View-only'}</span>${n.fileType === 'assignment' ? '<span class="badge badge-accent">Assignment</span>' : ''}`,
  typeFilter: [ { v:'study', label:'📄 Study material' }, { v:'assignment', label:'📝 Assignment' } ],
  typeOf: n=> n.fileType === 'assignment' ? 'assignment' : 'study',
  editFields: n=> [
    { k:'title', label:'Title', value:n.title }, { k:'subject', label:'Subject', value:n.subject },
    { k:'fileType', label:'Type', value: n.fileType === 'assignment' ? 'assignment' : 'study', options:[{v:'study',label:'Study material'},{v:'assignment',label:'Assignment'}] },
    { k:'downloadable', label:'Allow download?', value: n.downloadable ? 'yes' : 'no', options:[{v:'yes',label:'Yes — downloadable'},{v:'no',label:'No — view only'}] },
    { k:'driveLink', label:'Google Drive share link', value: n.driveLink || '' }
  ],
  buildUpdate: (f)=>{
    if(!f.title) return { error:'Enter a title' };
    if(!f.driveLink) return { error:'Paste the Drive link' };
    const driveId = driveIdFromUrl(f.driveLink); if(!driveId) return { error:'Could not read a file ID from that link' };
    return { update:{ title:f.title, subject:f.subject, fileType:f.fileType, downloadable:f.downloadable === 'yes', driveId, driveLink:f.driveLink } };
  },
  extraMenu: ()=> []
};

/* Returns the unsubscribe function (also registered with trackUnsub, so a screen change cleans it up). */
function renderPublishedContentSection(container, cfg){
  const filterWrap = el('<div class="pt-filters"></div>');
  const search = el(`<div class="search-input-wrap"><span class="si">${icon('search',15)}</span><input type="text" placeholder="Search ${esc(cfg.nouns)} by title..."></div>`);
  const batchSel = el('<select data-role="batch" aria-label="Batch"></select>');
  const typeSel = cfg.typeFilter ? el(`<select data-role="type" aria-label="Type"><option value="">All Types</option>${cfg.typeFilter.map(o=> `<option value="${esc(o.v)}">${esc(o.label)}</option>`).join('')}</select>`) : null;
  filterWrap.appendChild(search);
  if(typeSel){
    const row = el('<div class="row2" style="margin-bottom:8px"></div>'); row.appendChild(batchSel); row.appendChild(typeSel); filterWrap.appendChild(row);
  } else { batchSel.style.marginBottom = '8px'; filterWrap.appendChild(batchSel); }
  const toolbar = el('<div class="filter-toolbar"><div class="count"></div><button class="btn-sm btn-ghost" type="button">✕ Clear Filters</button></div>');
  filterWrap.appendChild(toolbar);
  const listBox = el('<div><div class="spinner"></div></div>');
  container.appendChild(filterWrap); container.appendChild(listBox);
  const searchInput = $('input', search), countEl = $('.count', toolbar);

  let items = null; // null until the first snapshot arrives

  function clearFilters(){ searchInput.value = ''; if(typeSel) typeSel.value = ''; ADMIN_CONTENT_BATCH = ''; refresh(); }

  function refresh(){
    if(items === null) return;
    batchSel.innerHTML = batchFilterOptions(items, ADMIN_CONTENT_BATCH);
    batchSel.value = ADMIN_CONTENT_BATCH;
    const q = searchInput.value.trim().toLowerCase(), tv = typeSel ? typeSel.value : '';
    const filtered = items.filter(it=>{
      if(ADMIN_CONTENT_BATCH && (it.batchId || '') !== ADMIN_CONTENT_BATCH) return false; // canonical batchId, not the name
      if(tv && cfg.typeOf(it) !== tv) return false;
      if(q && !((it.title || '') + ' ' + (it.subject || '')).toLowerCase().includes(q)) return false;
      return true;
    }).sort((a,b)=> (tsToMs(b.createdAt) || 0) - (tsToMs(a.createdAt) || 0));
    countEl.textContent = items.length ? (filtered.length + ' of ' + items.length + ' ' + (items.length === 1 ? cfg.noun : cfg.nouns)) : '';
    listBox.innerHTML = '';
    if(!items.length){ listBox.appendChild(el(`<div class="empty-state"><div class="icon">${cfg.emptyIcon}</div>${esc(cfg.emptyText)}</div>`)); return; }
    if(!filtered.length){
      const es = el(`<div class="empty-state"><div class="icon">🔍</div>No ${esc(cfg.nouns)} match your filters.</div>`);
      const b = el('<button class="btn btn-ghost" style="max-width:200px;margin:12px auto 0">✕ Clear Filters</button>');
      b.addEventListener('click', clearFilters); es.appendChild(b); listBox.appendChild(es); return;
    }
    filtered.forEach(it=> listBox.appendChild(buildCard(it)));
  }

  function buildCard(it){
    const off = it.active === false;
    const badges = (cfg.badges ? cfg.badges(it) : '') + (off ? '<span class="badge badge-muted">Inactive</span>' : '') + sharedBadge(it);
    const card = el(`<div class="item-card">
      <div class="item-top"><div class="item-icon">${cfg.icon(it)}</div><div class="item-info">
        <div class="item-title">${esc(it.title || 'Untitled')}</div>
        <div class="item-meta">${esc(cfg.meta(it))}${(it.batchName || it.batch) ? (cfg.meta(it) ? ' · ' : '') + esc(it.batchId === GENERAL_BATCH_ID ? 'Free Demo' : (it.batchName || it.batch)) : ''}</div>
        ${badges ? `<div class="item-badges">${badges}</div>` : ''}
      </div></div>
      <div class="item-actions">
        <button class="btn-sm btn-ghost" data-act="edit" type="button">${icon('edit',15)}<span>Edit</span></button>
        <button class="btn-sm ${off ? 'btn-success' : 'btn-warning'}" data-act="toggle" type="button">${icon(off ? 'check' : 'ban',15)}<span>${off ? 'Activate' : 'Deactivate'}</span></button>
        <button class="batch-menu-btn" data-act="menu" type="button" aria-label="Actions">⋮</button>
      </div>
    </div>`);
    $all('button', card).forEach(b=> b.addEventListener('click', async ()=>{
      const act = b.dataset.act;
      if(act === 'edit'){ openContentEditSheet(cfg, it); return; }
      if(act === 'toggle'){
        b.disabled = true;
        try{
          await db.collection(cfg.col).doc(it.id).update({ active: off, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
          toast(off ? 'Activated' : 'Deactivated');
        }catch(e){ console.error(e); toast('Could not update — check your connection.'); b.disabled = false; }
        return;
      }
      openActionMenu(it.title, cfg.extraMenu(it).concat([{ key:'del', label:'Delete', icon:'trash', danger:true }]), async key=>{
        if(key === 'del'){
          if(!await confirmDelete()) return;
          b.disabled = true;
          try{ await db.collection(cfg.col).doc(it.id).delete(); toast('Deleted'); }
          catch(e){ console.error(e); toast('Could not delete — check your connection.'); b.disabled = false; }
        } else if(key.startsWith('status:')){
          try{ await db.collection(cfg.col).doc(it.id).update({ status: key.slice(7) }); toast('Updated'); }
          catch(e){ console.error(e); toast('Could not update — check your connection.'); }
        }
      });
    }));
    return card;
  }

  batchSel.addEventListener('change', ()=>{ ADMIN_CONTENT_BATCH = batchSel.value; refresh(); });
  if(typeSel) typeSel.addEventListener('change', refresh);
  searchInput.addEventListener('input', refresh);
  $('button', toolbar).addEventListener('click', clearFilters);

  const unsub = db.collection(cfg.col).onSnapshot(snap=>{
    items = []; snap.forEach(d=> items.push({ id:d.id, ...d.data() }));
    refresh();
  }, err=>{ console.error(err); listBox.innerHTML = '<div class="empty-state">Could not load — check your connection.</div>'; });
  trackUnsub(unsub);
  return unsub;
}

function renderAdminClasses(container){
  let sub = 'published', teardown = null; // published | recorded | live
  const tabs = el(`<div class="tab-filter tab-wrap"><button data-s="published">📋 Published Classes</button><button data-s="recorded">➕ Add Recorded</button><button data-s="live">➕ Add Live Class</button></div>`);
  container.appendChild(tabs);
  const body = el(`<div></div>`);
  container.appendChild(body);
  function draw(){
    if(teardown){ teardown(); teardown = null; }
    $all('button',tabs).forEach(x=> x.classList.toggle('active', x.dataset.s===sub));
    body.innerHTML = '';
    if(sub==='published') teardown = drawPublishedClasses(body);
    else if(sub==='recorded') drawRecordedForm(body);
    else drawLiveForm(body);
  }
  tabs.addEventListener('click', e=>{ const b=e.target.closest('button'); if(!b) return; sub=b.dataset.s; draw(); });
  draw();
}

/* Published Classes: Recorded / Live Class, each with the shared Batch filter. */
function drawPublishedClasses(body){
  const chips = el(`<div class="tab-filter"><button data-k="recorded">📹 Recorded</button><button data-k="live">🔴 Live Class</button></div>`);
  const box = el('<div></div>');
  body.appendChild(chips); body.appendChild(box);
  let unsub = null;
  function draw(){
    if(unsub){ unsub(); unsub = null; }
    $all('button',chips).forEach(x=> x.classList.toggle('active', x.dataset.k===ADMIN_CLASS_KIND));
    box.innerHTML = '';
    unsub = renderPublishedContentSection(box, ADMIN_CLASS_KIND==='live' ? LIVE_CFG : VIDEO_CFG);
  }
  chips.addEventListener('click', e=>{ const b=e.target.closest('button'); if(!b || b.dataset.k===ADMIN_CLASS_KIND) return; ADMIN_CLASS_KIND=b.dataset.k; draw(); });
  draw();
  return ()=>{ if(unsub) unsub(); };
}

function drawRecordedForm(body){
  body.appendChild(el(`<div>
    <div class="card">
      <div class="card-title">➕ Add recorded lecture (YouTube unlisted)</div>
      <div class="field"><label>YouTube link</label><input id="vUrl" placeholder="https://youtu.be/..."></div>
      <div class="field"><label>Title</label><input id="vTitle" placeholder="Class 27 — Electric Current Part 01"></div>
      <div class="row2">
        <div class="field"><label>Subject</label><input id="vSubject" placeholder="Physics"></div>
        <div class="field"><label>Batch</label><select id="vBatch"><option value="">Select batch...</option></select></div>
      </div>
      <div class="row2">
        <div class="field"><label>Chapter</label><input id="vChapter" placeholder="Electric Current"></div>
        <div class="field"><label>Class no.</label><input id="vClassNo" placeholder="27"></div>
      </div>
      <div class="field"><label>Duration</label><input id="vDuration" placeholder="48:32"></div>
      <button class="btn btn-primary" id="saveVideo">💾 Save to Firebase</button>
    </div>
  </div>`));
  loadActiveBatchesInto($('#vBatch', body));
  $('#saveVideo', body).addEventListener('click', async ()=>{
    const url = $('#vUrl',body).value.trim();
    const title = $('#vTitle',body).value.trim();
    const batchSel = $('#vBatch',body);
    const batchId = batchSel.value;
    if(!url || !title){ toast('Fill link and title'); return; }
    if(!batchId){ toast('Select a batch'); return; }
    const batchName = batchId === GENERAL_BATCH_ID ? 'Free Demo' : batchSel.selectedOptions[0].textContent;
    await db.collection(COL.videos).add({
      ytId: ytIdFromUrl(url), title,
      subject: $('#vSubject',body).value.trim(), batchId, batchName,
      chapter: $('#vChapter',body).value.trim(), classNo: $('#vClassNo',body).value.trim(),
      duration: $('#vDuration',body).value.trim(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('Saved to Firebase!');
    ['vUrl','vTitle','vChapter','vClassNo','vDuration'].forEach(id=> $('#'+id,body).value='');
    batchSel.value = '';
  });
}

function drawLiveForm(body){
  body.appendChild(el(`<div>
    <div class="card">
      <div class="card-title">➕ Schedule live class (Google Meet)</div>
      <div class="field"><label>Google Meet link</label><input id="lUrl" placeholder="https://meet.google.com/xxx-xxxx-xxx"></div>
      <div class="field"><label>Title</label><input id="lTitle" placeholder="Live Class 28 — EM Induction"></div>
      <div class="row2">
        <div class="field"><label>Subject</label><input id="lSubject" placeholder="Physics"></div>
        <div class="field"><label>Batch</label><select id="lBatch"><option value="">Select batch...</option></select></div>
      </div>
      <div class="row2">
        <div class="field"><label>Date</label><input type="date" id="lDate"></div>
        <div class="field"><label>Time</label><input type="time" id="lTime" value="17:00"></div>
      </div>
      <button class="btn btn-primary" id="saveLive">💾 Save to Firebase</button>
    </div>
  </div>`));
  loadActiveBatchesInto($('#lBatch', body));
  $('#saveLive', body).addEventListener('click', async ()=>{
    const url = $('#lUrl',body).value.trim();
    const title = $('#lTitle',body).value.trim();
    const batchSel = $('#lBatch',body);
    const batchId = batchSel.value;
    if(!url || !title){ toast('Fill link and title'); return; }
    if(!batchId){ toast('Select a batch'); return; }
    const batchName = batchId === GENERAL_BATCH_ID ? 'Free Demo' : batchSel.selectedOptions[0].textContent;
    await db.collection(COL.liveClasses).add({
      meetLink: url, title, subject: $('#lSubject',body).value.trim(), batchId, batchName,
      date: $('#lDate',body).value, time: $('#lTime',body).value,
      status: 'upcoming', createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('Saved to Firebase!');
    $('#lUrl',body).value=''; $('#lTitle',body).value=''; batchSel.value='';
  });
}

/* ================================================================
   ADMIN — Tests workspace (Published Tests / Create Test / Results)
   ----------------------------------------------------------------
   Three internal tabs under the existing "Tests" nav entry — no new
   top-level nav items. A single onSnapshot on COL.tests is shared by
   Published Tests and the Results test-picker (avoids two listeners
   reading the same collection); Results itself fetches attempts/
   results only for ONE selected test at a time via loadTestResultsGroups(),
   never the whole attempts/results collections. Published Tests is
   the default view every time this screen opens.
   ================================================================ */
function renderAdminTests(container){
  let sub = 'published'; // published | create | results
  const tabs = el(`<div class="tab-filter">
    <button data-s="published">📋 Published Tests</button>
    <button data-s="create">➕ Create Test</button>
    <button data-s="results">📊 Results</button>
  </div>`);
  container.appendChild(tabs);
  const body = el(`<div></div>`);
  container.appendChild(body);

  let allTests = [];
  let loaded = false; // true once the first test-list snapshot has arrived
  let publishedRefresh = null, resultsRefresh = null;

  function setTab(s){
    sub = s;
    $all('button',tabs).forEach(x=>x.classList.toggle('active', x.dataset.s===s));
    draw();
  }
  $all('button',tabs).forEach(b=> b.classList.toggle('active', b.dataset.s===sub));
  tabs.addEventListener('click', e=>{
    const b=e.target.closest('button'); if(!b) return;
    setTab(b.dataset.s);
  });

  function draw(){
    body.innerHTML = '';
    publishedRefresh = null; resultsRefresh = null;
    if(sub==='create'){
      // Create Test doesn't depend on the test list, so it never waits on `loaded`.
      drawCreateTestSection(body, { onGoToPublished: ()=> setTab('published') });
    } else if(!loaded){
      body.appendChild(el(`<div class="spinner"></div>`));
    } else if(sub==='results'){
      resultsRefresh = drawResultsSection(body, ()=>allTests);
    } else {
      publishedRefresh = renderPublishedTestsSection(body, ()=>allTests, { onCreateTest: ()=> setTab('create') });
    }
  }
  draw();

  const unsubTests = db.collection(COL.tests).onSnapshot(snap=>{
    allTests = []; snap.forEach(d=>allTests.push({id:d.id,...d.data()}));
    const firstLoad = !loaded;
    loaded = true;
    if(firstLoad && sub !== 'create') draw();
    else if(sub==='published' && publishedRefresh) publishedRefresh();
    else if(sub==='results' && resultsRefresh) resultsRefresh();
  }, err=>{ console.error('[admin-tests] load failed', err); });
  trackUnsub(unsubTests);
}

/* ---------- 2.A Create Test — unchanged Manual Builder / Text Generator, just relocated
   under this tab, plus a small success banner with a way back to Published Tests. ---------- */
function drawCreateTestSection(container, opts){
  opts = opts || {};
  const banner = el(`<div class="card" id="createSuccessBanner" style="display:none;border-color:var(--success-brd);background:var(--success-bg)">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div style="font-size:13px;color:var(--success);font-weight:600">✅ Test published!</div>
      <button class="btn-sm btn-ghost" type="button" id="viewPublishedBtn">View Published Tests →</button>
    </div>
  </div>`);
  container.appendChild(banner);
  $('#viewPublishedBtn', banner).addEventListener('click', ()=> opts.onGoToPublished && opts.onGoToPublished());

  const tabs = el(`<div class="tab-filter"><button data-s="manual">🛠 Manual builder</button><button data-s="paste">📝 Text generator</button></div>`);
  container.appendChild(tabs);
  const body = el(`<div></div>`);
  container.appendChild(body);
  let sub = 'manual';
  $all('button',tabs).forEach(b=> b.classList.toggle('active', b.dataset.s===sub));
  tabs.addEventListener('click', e=>{
    const b=e.target.closest('button'); if(!b) return;
    sub = b.dataset.s;
    $all('button',tabs).forEach(x=>x.classList.toggle('active',x===b));
    banner.style.display = 'none';
    draw();
  });
  function showBanner(){ banner.style.display = ''; }
  function draw(){ body.innerHTML=''; if(sub==='manual') drawManualBuilder(body, showBanner); else drawTextGenerator(body, showBanner); }
  draw();
}

/* ---------- 2.B Published Tests — search, batch/subject/type filters, sort, Clear Filters,
   match counter, and the two distinct empty states the spec calls for. Filters run over the
   already-loaded `tests` array (getTests()) — no new Firestore query on every keystroke. ---------- */
function renderPublishedTestsSection(container, getTests, opts){
  opts = opts || {};
  // Part L: this filter block is visually oversized on Admin -> Tests -> Published Tests.
  // Scoped to .pt-filters (this function only) rather than touching .search-input-wrap /
  // select globally, so Notes/Announcements/Results and every other search bar in the app
  // keep their existing size untouched.
  const filterWrap = el(`<div class="pt-filters"></div>`);
  container.appendChild(filterWrap);
  const searchWrap = el(`<div class="search-input-wrap"><span class="si">${icon('search',15)}</span><input type="text" id="ptSearch" placeholder="Search tests by title..."></div>`);
  filterWrap.appendChild(searchWrap);

  const selRow = el(`<div class="row2" style="margin-bottom:8px">
    <select id="ptBatch"><option value="">All Batches</option></select>
    <select id="ptSubject"><option value="">All Subjects</option></select>
  </div>`);
  filterWrap.appendChild(selRow);

  const selRow2 = el(`<div class="row2" style="margin-bottom:8px">
    <select id="ptType">
      <option value="">All Types</option>
      <option value="live">🔴 Live</option>
      <option value="regular">⏱ Regular</option>
      <option value="practice">📚 Practice</option>
    </select>
    <select id="ptSort">
      <option value="new">Newest First</option>
      <option value="old">Oldest First</option>
      <option value="title">Title A–Z</option>
    </select>
  </div>`);
  filterWrap.appendChild(selRow2);

  const toolbar = el(`<div class="filter-toolbar"><div class="count" id="ptCount"></div><button class="btn-sm btn-ghost" type="button" id="ptClear">✕ Clear Filters</button></div>`);
  filterWrap.appendChild(toolbar);

  const listBox = el(`<div><div class="spinner"></div></div>`);
  container.appendChild(listBox);

  function populateSelects(tests){
    const batchSel = $('#ptBatch', selRow);
    batchSel.innerHTML = batchFilterOptions(tests, ADMIN_CONTENT_BATCH); // shared with Published Classes / Notes
    batchSel.value = ADMIN_CONTENT_BATCH;

    const subjSel = $('#ptSubject', selRow), curS = subjSel.value;
    const subjects = uniqueSubjects(tests);
    subjSel.innerHTML = '<option value="">All Subjects</option>' + subjects.map(s=>`<option value="${esc(s.key)}">${esc(s.label)}</option>`).join('');
    if(subjects.some(s=>s.key===curS)) subjSel.value = curS;
  }

  function clearFilters(){
    $('#ptSearch', searchWrap).value = '';
    ADMIN_CONTENT_BATCH = '';
    $('#ptBatch', selRow).value = '';
    $('#ptSubject', selRow).value = '';
    $('#ptType', selRow2).value = '';
    $('#ptSort', selRow2).value = 'new';
    refresh();
  }

  function refresh(){
    const tests = getTests();
    populateSelects(tests);
    const q = ($('#ptSearch',searchWrap).value||'').trim().toLowerCase();
    const batchId = $('#ptBatch',selRow).value;
    const subjKey = $('#ptSubject',selRow).value;
    const typeVal = $('#ptType',selRow2).value;
    const sortVal = $('#ptSort',selRow2).value;

    let filtered = tests.filter(t=>{
      if(batchId && (t.batchId||'') !== batchId) return false;
      if(subjKey && normalizeSubjectKey(t.subject) !== subjKey) return false;
      if(typeVal && testKind(t) !== typeVal) return false;
      if(q){
        const hay = ((t.title||'')+' '+(t.subject||'')+' '+(t.batchName||t.batch||'')).toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    });
    filtered.sort((a,b)=>{
      if(sortVal==='title') return (a.title||'').localeCompare(b.title||'');
      const ta = tsToMs(a.createdAt) || 0, tb = tsToMs(b.createdAt) || 0;
      return sortVal==='old' ? ta-tb : tb-ta;
    });

    $('#ptCount', toolbar).textContent = tests.length ? (filtered.length + ' of ' + tests.length + ' test' + (tests.length===1?'':'s')) : '';

    listBox.innerHTML = '';
    if(!tests.length){
      const es = el(`<div class="empty-state"><div class="icon">📋</div>No published tests exist.</div>`);
      const btn = el(`<button class="btn btn-primary" style="max-width:220px;margin:12px auto 0">+ Create Test</button>`);
      btn.addEventListener('click', ()=> opts.onCreateTest && opts.onCreateTest());
      es.appendChild(btn);
      listBox.appendChild(es);
      return;
    }
    if(!filtered.length){
      const es = el(`<div class="empty-state"><div class="icon">🔍</div>No tests match your filters.</div>`);
      const btn = el(`<button class="btn btn-ghost" style="max-width:200px;margin:12px auto 0">✕ Clear Filters</button>`);
      btn.addEventListener('click', clearFilters);
      es.appendChild(btn);
      listBox.appendChild(es);
      return;
    }

    filtered.forEach(t=>{
      const kind = testKind(t), km = TEST_KIND_META[kind];
      const created = tsToMs(t.createdAt);
      const card = el(`<div class="item-card">
        <div class="item-top"><div class="item-icon">${km.icon}</div><div class="item-info">
          <div class="item-title">${esc(t.title)}</div>
          <div class="item-meta">${esc(t.subject||'')}${(t.batchName||t.batch)?(' · '+esc(t.batchName||t.batch)):''}${t.questionCount?(' · '+t.questionCount+' Qs'):''}${t.duration?(' · '+t.duration+' min'):''}</div>
          <div class="item-meta" style="display:flex;flex-wrap:wrap;align-items:center;gap:6px"><span>${km.icon} ${km.label}${created ? (' · Created '+esc(fmtDate(created))) : ''}</span>${liveStatusBadge(t)}${t.active===false?'<span class="badge badge-muted">Inactive</span>':''}${sharedBadge(t)}</div>
        </div></div>
        <div class="item-actions">
          ${Array.isArray(t.questions) && t.questions.length ? `
          <button class="btn-sm btn-ghost" data-act="edit">${icon('edit',15)}<span>Edit</span></button>` : ''}
          <button class="btn-sm ${t.active===false?'btn-success':'btn-warning'}" data-act="toggle">${icon(t.active===false?'check':'ban',15)}<span>${t.active===false?'Activate':'Deactivate'}</span></button>
          <button class="batch-menu-btn" data-act="menu" type="button" aria-label="Actions">⋮</button>
        </div>
      </div>`);
      const structured = Array.isArray(t.questions) && t.questions.length;
      $all('button',card).forEach(b=>b.addEventListener('click', async ()=>{
        // ⋮ → Copy / Delete: the menu just re-dispatches to the same handlers below (nothing about Copy or Delete changed).
        if(b.dataset.act==='menu'){
          openActionMenu(t.title, (structured ? [{ key:'dup', label:'Copy', icon:'layers' }] : []).concat([{ key:'del', label:'Delete', icon:'trash', danger:true }]), key=> runAct(key, b));
          return;
        }
        runAct(b.dataset.act, b);
      }));
      async function runAct(act, b){
        if(act==='del'){
          if(!await confirmDelete()) return;
          b.disabled = true;
          try{ await db.collection(COL.tests).doc(t.id).delete(); toast('Deleted'); }
          catch(e){ console.error(e); toast('Could not delete — check your connection.'); b.disabled = false; }
        }
        else if(act==='edit'){ openEditTestSheet(t, { duplicate:false }); }
        else if(act==='dup'){ openEditTestSheet(t, { duplicate:true }); }
        else if(act==='toggle'){
          // Visibility switch only — identical in spirit to Announcement/Banner activation, and
          // completely independent of Live Test scheduling (liveStartAt/liveEndAt untouched).
          b.disabled = true;
          try{
            await db.collection(COL.tests).doc(t.id).update({ active: t.active===false, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            toast(t.active===false ? 'Activated' : 'Deactivated');
          }catch(e){ console.error(e); toast('Could not update — check your connection.'); b.disabled = false; }
        }
      }
      listBox.appendChild(card);
    });
  }

  $('#ptSearch', searchWrap).addEventListener('input', refresh);
  selRow.addEventListener('change', ()=>{ ADMIN_CONTENT_BATCH = $('#ptBatch', selRow).value; refresh(); });
  selRow2.addEventListener('change', refresh);
  $('#ptClear', toolbar).addEventListener('click', clearFilters);

  refresh();
  return refresh;
}

/* ---------- 2.C Central Results — a batch/subject/title-filtered test picker, then the SAME
   loadTestResultsGroups()/renderTestResultGroups() the per-test Results button uses, so results
   are never fetched or stored twice. Batch/Subject filter WHICH TEST'S results you're looking at
   (attempts/results docs don't carry batchId themselves); Student name filters the loaded groups
   client-side once a test is picked — no per-keystroke query. ---------- */
function drawResultsSection(container, getTests){
  container.appendChild(el(`<div class="card-title">📊 Results</div>`));

  const searchWrap = el(`<div class="search-input-wrap"><span class="si">${icon('search',15)}</span><input type="text" id="rsSearch" placeholder="Search tests by title..."></div>`);
  container.appendChild(searchWrap);

  const selRow = el(`<div class="row2" style="margin-bottom:10px">
    <select id="rsBatch"><option value="">All Batches</option></select>
    <select id="rsSubject"><option value="">All Subjects</option></select>
  </div>`);
  container.appendChild(selRow);

  const toolbar = el(`<div class="filter-toolbar"><div class="count" id="rsCount"></div><button class="btn-sm btn-ghost" type="button" id="rsClear">✕ Clear Filters</button></div>`);
  container.appendChild(toolbar);

  const pickerBox = el(`<div id="rsPicker"></div>`);
  container.appendChild(pickerBox);
  const pane = el(`<div id="rsPane" style="margin-top:6px"></div>`);
  container.appendChild(pane);

  let selectedTestId = null;

  function populateSelects(tests){
    const batchSel = $('#rsBatch', selRow), curB = batchSel.value;
    const batches = uniqueBatchesFromTests(tests);
    batchSel.innerHTML = '<option value="">All Batches</option>' + batches.map(b=>`<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('');
    if(batches.some(b=>b.id===curB)) batchSel.value = curB;

    const subjSel = $('#rsSubject', selRow), curS = subjSel.value;
    const subjects = uniqueSubjects(tests);
    subjSel.innerHTML = '<option value="">All Subjects</option>' + subjects.map(s=>`<option value="${esc(s.key)}">${esc(s.label)}</option>`).join('');
    if(subjects.some(s=>s.key===curS)) subjSel.value = curS;
  }

  function refresh(){
    const tests = getTests();
    populateSelects(tests);
    const q = ($('#rsSearch',searchWrap).value||'').trim().toLowerCase();
    const batchId = $('#rsBatch',selRow).value;
    const subjKey = $('#rsSubject',selRow).value;
    let filtered = tests.filter(t=>{
      if(batchId && (t.batchId||'') !== batchId) return false;
      if(subjKey && normalizeSubjectKey(t.subject) !== subjKey) return false;
      if(q && !(t.title||'').toLowerCase().includes(q)) return false;
      return true;
    });
    filtered.sort((a,b)=> (tsToMs(b.createdAt)||0) - (tsToMs(a.createdAt)||0));
    $('#rsCount', toolbar).textContent = tests.length ? (filtered.length + ' of ' + tests.length + ' test' + (tests.length===1?'':'s')) : '';

    pickerBox.innerHTML = '';
    if(!tests.length){ pickerBox.appendChild(el(`<div class="empty-state">No published tests exist yet.</div>`)); return; }
    if(!filtered.length){
      const es = el(`<div class="empty-state">No tests match your filters.</div>`);
      const btn = el(`<button class="btn btn-ghost" style="max-width:200px;margin:12px auto 0">✕ Clear Filters</button>`);
      btn.addEventListener('click', clearFilters);
      es.appendChild(btn);
      pickerBox.appendChild(es);
      return;
    }
    filtered.forEach(t=>{
      const km = TEST_KIND_META[testKind(t)];
      const row = el(`<div class="item-card tap-card" style="cursor:pointer${selectedTestId===t.id?';border-color:var(--accent)':''}">
        <div class="item-title" style="font-size:14px">${esc(t.title)}</div>
        <div class="item-meta">${esc(t.subject||'')}${(t.batchName||t.batch)?' · '+esc(t.batchName||t.batch):''} · ${km.icon} ${km.label}</div>
      </div>`);
      row.addEventListener('click', ()=>{ selectedTestId = t.id; selectTest(t); refresh(); });
      pickerBox.appendChild(row);
    });
  }

  function clearFilters(){
    $('#rsSearch', searchWrap).value = '';
    $('#rsBatch', selRow).value = '';
    $('#rsSubject', selRow).value = '';
    refresh();
  }

  async function selectTest(t){
    pane.innerHTML = '';
    const batchLbl = t.batchId === GENERAL_BATCH_ID ? 'Free Demo' : (t.batchName || t.batch || '');
    pane.appendChild(el(`<div class="card-title" style="margin-top:8px">📄 ${esc(t.title)}</div>`));
    if(batchLbl) pane.appendChild(el(`<div class="item-meta" style="margin:-6px 0 10px">${esc(batchLbl)}</div>`));

    const subTabs = el(`<div class="tab-filter">
      <button data-s="students">👥 Student Results</button>
      <button data-s="analytics">📊 Analytics</button>
    </div>`);
    pane.appendChild(subTabs);
    const subBody = el(`<div></div>`);
    pane.appendChild(subBody);

    let sub = 'students'; // Student Results stays the default — unchanged from before this feature
    let groups = null;

    async function ensureGroups(){
      if(groups) return groups;
      subBody.innerHTML = '<div class="spinner"></div>';
      try{ groups = await loadTestResultsGroups(t.id); }
      catch(e){ console.error(e); subBody.innerHTML = '<div class="empty-state">Could not load results.</div>'; throw e; }
      return groups;
    }

    async function drawStudents(){
      subBody.innerHTML = '';
      const nameWrap = el(`<div class="search-input-wrap"><span class="si">${icon('search',15)}</span><input type="text" id="rsNameFilter" placeholder="Search student name..."></div>`);
      subBody.appendChild(nameWrap);
      const groupsBox = el(`<div><div class="spinner"></div></div>`);
      subBody.appendChild(groupsBox);
      async function load(){
        groupsBox.innerHTML = '<div class="spinner"></div>';
        try{ groups = await loadTestResultsGroups(t.id); }
        catch(e){ console.error(e); groupsBox.innerHTML = '<div class="empty-state">Could not load results.</div>'; return; }
        paint();
      }
      function paint(){
        renderTestResultGroups(groupsBox, t, groups, { nameFilter: $('#rsNameFilter',nameWrap).value, onReload: load });
      }
      $('#rsNameFilter', nameWrap).addEventListener('input', paint);
      if(groups){ paint(); } else { await load(); }
    }

    async function drawAnalytics(){
      subBody.innerHTML = '<div class="spinner"></div>';
      try{ await ensureGroups(); } catch(e){ return; }
      renderTestAnalytics(subBody, t, groups);
    }

    function draw(){ if(sub === 'analytics') drawAnalytics(); else drawStudents(); }
    $all('button', subTabs).forEach(b => b.classList.toggle('active', b.dataset.s === sub));
    subTabs.addEventListener('click', e => {
      const b = e.target.closest('button'); if(!b) return;
      sub = b.dataset.s;
      $all('button', subTabs).forEach(x => x.classList.toggle('active', x === b));
      draw();
    });
    draw();
  }

  $('#rsSearch', searchWrap).addEventListener('input', refresh);
  selRow.addEventListener('change', refresh);
  $('#rsClear', toolbar).addEventListener('click', clearFilters);

  refresh();
  return refresh;
}

/* Admin confirmation sheet — exact wording + explicit Cancel / confirm buttons (a stray tap does nothing). */
function adminConfirmSheet(o){
  return new Promise(resolve => {
    const ov = el(`<div class="overlay open" style="align-items:center;z-index:1200"><div class="sheet" style="border-radius:16px;max-width:360px;padding:20px 18px;transform:none">
      <div style="font-size:15px;font-weight:700;line-height:1.4;margin-bottom:10px">${esc(o.title)}</div>
      ${(o.lines||[]).map(l => `<div style="font-size:13px;color:var(--text-muted);line-height:1.5;margin-bottom:8px">${esc(l)}</div>`).join('')}
      ${o.warn ? `<div class="auth-error" style="display:block;margin:10px 0">${esc(o.warn)}</div>` : ''}
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn btn-ghost" type="button" data-no>${esc(o.cancel || 'Cancel')}</button>
        <button class="btn btn-danger" type="button" data-yes>${esc(o.confirm || 'Confirm')}</button>
      </div></div></div>`);
    document.body.appendChild(ov);
    const done = v => { ov.remove(); resolve(v); };
    $('[data-no]', ov).addEventListener('click', () => done(false));
    $('[data-yes]', ov).addEventListener('click', () => done(true));
  });
}

/* Generic "delete this item" confirmation — the standard dialog every plain Delete button
   (Classes/Recorded, Classes/Live Class, Tests/Published Tests, Notes) shows before deleting.
   Built on the exact same adminConfirmSheet component/styling Delete History already uses,
   so nothing new was introduced — just reused with the requested wording. */
function confirmDelete(){
  return adminConfirmSheet({
    title: 'Are you sure you want to delete?',
    lines: ['This action cannot be undone. The selected item will be permanently deleted.'],
    cancel: 'Cancel', confirm: 'Delete'
  });
}

/* Admin-only: remove ONE student's whole attempt history for ONE test — every testAttempts document
   (including an unfinished one) and every testResults document for that student + test. Nothing else:
   not the test definition, not other students, not other tests. Firestore rules only allow admins to delete these. */
async function adminDeleteTestHistory(t, studentId){
  if(!t || !t.id || !studentId) throw new Error('Missing test or student');
  const [aSnap, rSnap] = await Promise.all([
    db.collection(COL.testAttempts).where('studentId','==',studentId).where('testId','==',t.id).get(),
    db.collection(COL.testResults).where('studentId','==',studentId).where('testId','==',t.id).get()
  ]);
  const refs = []; let attempts = 0, results = 0;
  aSnap.forEach(d => { const x = d.data(); if(x.studentId === studentId && x.testId === t.id){ refs.push(d.ref); attempts++; } });
  rSnap.forEach(d => { const x = d.data(); if(x.studentId === studentId && x.testId === t.id){ refs.push(d.ref); results++; } });
  for(let i = 0; i < refs.length; i += 450){
    const b = db.batch();
    refs.slice(i, i + 450).forEach(r => b.delete(r));
    await b.commit();
  }
  return { attempts, results };
}

/* ---------- Results — shared data + render, used by the central Admin → Tests → Results tab,
   so results are never fetched or rendered by two different code paths. loadTestResultsGroups() does the one-time fetch (no listener — the caller
   decides when to reload, e.g. after Delete History); renderTestResultGroups() paints whatever
   groups it's given into any container, with an optional client-side nameFilter (no new query). ---------- */
async function loadTestResultsGroups(testId){
  const [aSnap, rSnap] = await Promise.all([
    db.collection(COL.testAttempts).where('testId','==',testId).get(),
    db.collection(COL.testResults).where('testId','==',testId).get()
  ]);
  // one group per student: their attempt documents (any status) + pre-Phase-1 result rows
  const groups = new Map();
  const grp = id => { if(!groups.has(id)) groups.set(id, { studentId:id, name:'', attempts:[], legacy:[] }); return groups.get(id); };
  aSnap.forEach(d => { const a = { id:d.id, ...d.data() }; grp(a.studentId).attempts.push(a); });
  rSnap.forEach(d => { const r = d.data(); const g = grp(r.studentId); if(r.studentName) g.name = r.studentName; if(!r.attemptId) g.legacy.push(r); });
  // a student who only has an unfinished attempt has no result row yet (so no name on file)
  await Promise.all([...groups.values()].filter(g => !g.name).map(async g => {
    try{ const s = await db.collection(COL.students).doc(g.studentId).get(); g.name = s.exists ? (s.data().fullName || '') : ''; }catch(e){}
  }));
  return groups;
}

/* Batch-specific test analytics — computed ENTIRELY in memory from the exact same `groups` data
   loadTestResultsGroups() already fetched for the Student Results list above (one test = one
   Firestore query pair, reused for both views; this function issues zero further reads). A test
   already belongs to exactly one batch (or the existing General Demo convention), so selecting a
   test already IS selecting its batch — there is no separate per-student batch lookup here, and
   none is added. */
function computeTestAnalytics(t, groups){
  const def = getTestDef(t);
  const N = def.engine ? def.questions.length : 0;
  const qStats = Array.from({length:N}, () => ({ correct:0, wrong:0, unans:0, timeSum:0, timeCount:0 }));
  let submitted = 0, inProgress = 0;
  const scores = [], pcts = [], totalTimes = [];

  groups.forEach(g => {
    g.attempts.forEach(a => {
      if(a.status === 'completed'){
        submitted++;
        scores.push(Number(a.score) || 0);
        if(Number(a.total) > 0) pcts.push((Number(a.score)/Number(a.total)) * 100);
        const atTime = attemptTotalTime(a);
        if(atTime != null) totalTimes.push(atTime);
        if(def.engine && Array.isArray(a.answers)){
          a.answers.forEach(ans => {
            if(!ans || typeof ans.questionIndex !== 'number') return;
            const qi = ans.questionIndex; if(qi < 0 || qi >= N) return;   // test edited since this attempt — skip out-of-range
            const q = def.questions[qi];
            if(ans.selectedAnswer == null) qStats[qi].unans++;
            else if(q && ans.selectedAnswer === q.correct) qStats[qi].correct++;
            else qStats[qi].wrong++;
            if(ans.timeSpentSeconds != null){ qStats[qi].timeSum += Number(ans.timeSpentSeconds) || 0; qStats[qi].timeCount++; }
          });
        }
      } else if(a.status === 'in-progress'){
        inProgress++;
      }
    });
    // Legacy (pre-Phase-1) rows are genuinely submitted results, so they count toward submitted/
    // score stats — but they were never stored with a per-question answers[] breakdown, so they
    // can't contribute to question-wise stats or per-attempt timing. That's a real, honest gap in
    // old data, not something to estimate around.
    g.legacy.forEach(r => {
      submitted++;
      scores.push(Number(r.score) || 0);
      if(Number(r.total) > 0) pcts.push((Number(r.score)/Number(r.total)) * 100);
    });
  });

  const avg = arr => arr.length ? arr.reduce((s,x)=>s+x,0)/arr.length : null;
  return {
    students: groups.size, submitted, inProgress,
    avgScore: avg(scores), avgPct: avg(pcts),
    highScore: scores.length ? Math.max(...scores) : null,
    lowScore: scores.length ? Math.min(...scores) : null,
    avgTotalTime: avg(totalTimes),
    engine: def.engine,
    questions: def.engine ? def.questions.map((q,i) => {
      const s = qStats[i], answered = s.correct + s.wrong + s.unans;
      return {
        index: i,
        preview: (String(q.text||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim() || '(no question text)').slice(0,140),
        correct: s.correct, wrong: s.wrong, unans: s.unans,
        pct: answered ? Math.round((s.correct/answered)*1000)/10 : null,
        avgTime: s.timeCount ? Math.round(s.timeSum/s.timeCount) : null,
        sampleSize: answered
      };
    }) : []
  };
}

function renderTestResultGroups(box, t, groups, opts){
  opts = opts || {};
  if(!groups.size){ box.innerHTML = '<div class="empty-state">No attempts yet.</div>'; return; }
  const scoreRows = g => g.attempts.filter(a => a.status === 'completed').concat(g.legacy);
  const best = g => scoreRows(g).reduce((m,r) => Math.max(m, Number(r.score) || 0), -Infinity);
  let list = [...groups.values()];
  if(opts.nameFilter){
    const q = opts.nameFilter.trim().toLowerCase();
    if(q) list = list.filter(g => (g.name||'').toLowerCase().includes(q));
  }
  list.sort((a,b) => best(b) - best(a));
  box.innerHTML = '';
  if(!list.length){ box.innerHTML = '<div class="empty-state">No students match your search.</div>'; return; }
  list.forEach((g, i) => {
    g.attempts.sort((a,b) => (a.attemptNumber||0) - (b.attemptNumber||0));
    const done = scoreRows(g), b = best(g), inprog = g.attempts.some(a => a.status === 'in-progress');
    const bestTxt = done.length ? `best ${fmtMarks(b)}/${fmtMarks(done.find(r => (Number(r.score)||0) === b).total)}` : 'no submitted attempt';
    const card = el(`<div class="card" style="padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <div style="min-width:0"><div style="font-weight:700;font-size:13px">#${i+1} ${esc(g.name || 'Student')}</div>
          <div style="font-size:11px;color:var(--text-dim)">${g.attempts.length + g.legacy.length} record${(g.attempts.length + g.legacy.length)===1?'':'s'} · ${esc(bestTxt)}${inprog ? ' · <span style="color:var(--warning)">unfinished attempt</span>' : ''}</div></div>
        <button class="btn-sm btn-danger" type="button" data-del style="white-space:nowrap;flex-shrink:0">${icon('trash',15)}<span>Delete History</span></button>
      </div>
      <div data-rows></div></div>`);
    const rows = $('[data-rows]', card);
    const rowHTML = (label, sub, right, review) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--border-soft);font-size:12px">
        <div style="min-width:0;flex:1"><div style="font-weight:600">${esc(label)}</div><div style="font-size:11px;color:var(--text-dim)">${sub}</div></div>
        <span style="font-weight:700">${right}</span>${review ? '<button class="btn-sm btn-ghost" type="button" data-rv>Review</button>' : ''}</div>`;
    g.attempts.forEach(a => {
      let node;
      if(a.status === 'completed'){
        const pct = (Number(a.total) > 0) ? Math.round((Number(a.score)/Number(a.total))*1000)/10 : null;
        const atTime = attemptTotalTime(a);
        node = el(rowHTML(attemptLabel(a.attemptNumber),
          `${esc(fmtDateTime(tsToMs(a.submittedAt)))} · ✓ ${esc(a.correct)} · ✗ ${esc(a.wrong)} · — ${esc(a.skipped)}${atTime!=null ? ' · ⏱ '+esc(fmtDurA(atTime)) : ''}`,
          `${esc(fmtMarks(a.score))}/${esc(fmtMarks(a.total))}${pct!=null ? ' ('+pct+'%)' : ''}`, true));
        $('[data-rv]', node).addEventListener('click', () => {
          const def = getTestDef(t);
          if(!def.engine){ toast('Review isn\u2019t available for this test.'); return; }
          openAttemptReview(t, def, attemptToView(a, def, { studentName: g.name }), { admin:true });
        });
      } else {
        node = el(rowHTML(attemptLabel(a.attemptNumber), `In progress · started ${esc(fmtDateTime(tsToMs(a.startedAt)))}`, '—', false));
      }
      rows.appendChild(node);
    });
    g.legacy.forEach(r => rows.appendChild(el(rowHTML('Earlier result', esc(fmtDateTime(tsToMs(r.submittedAt))), `${esc(fmtMarks(r.score))}/${esc(fmtMarks(r.total))}`, false))));
    $('[data-del]', card).addEventListener('click', async ev => {
      const btn = ev.currentTarget;
      const ok = await adminConfirmSheet({
        title: 'Delete all attempt history for this student and this test?',
        lines: [ `${g.name || 'This student'} · ${t.title || 'this test'}`,
                 'This will permanently remove all attempts and results for this test.',
                 'The student may then start the test again from Attempt 1.' ],
        warn: inprog ? 'This student has an unfinished attempt. It will also be removed and can no longer be resumed.' : '',
        cancel: 'Cancel', confirm: 'Delete History'
      });
      if(!ok) return;
      btn.disabled = true;
      try{
        const n = await adminDeleteTestHistory(t, g.studentId);
        toast(`History deleted (${n.attempts} attempt${n.attempts===1?'':'s'}, ${n.results} result${n.results===1?'':'s'})`);
        if(opts.onReload) await opts.onReload();
      }catch(e){
        console.error(e); toast('Could not delete history — check your connection or permissions.'); btn.disabled = false;
      }
    });
    box.appendChild(card);
  });
}

/* Renders the batch-scoped Test Overview + Question-wise analytics computed by
   computeTestAnalytics() above. Pure display — this function issues no Firestore calls itself;
   `groups` is exactly the data the Student Results view already loaded for this one test. */
function renderTestAnalytics(box, t, groups){
  const a = computeTestAnalytics(t, groups);
  const batchLbl = t.batchId === GENERAL_BATCH_ID ? 'Free Demo' : (t.batchName || t.batch || '—');
  const stat = (label, value) => `<div class="stat-tile"><div class="stat-val">${esc(String(value))}</div><div class="stat-lbl">${esc(label)}</div></div>`;

  let html = `<div class="item-meta" style="margin-bottom:10px">Batch: <b>${esc(batchLbl)}</b></div><div class="stat-grid">`;
  html += stat('Students attempted', a.students);
  html += stat('Submitted attempts', a.submitted);
  html += stat('In progress', a.inProgress);
  html += stat('Average score', a.avgScore != null ? fmtMarks(a.avgScore) : '—');
  html += stat('Average %', a.avgPct != null ? (Math.round(a.avgPct*10)/10)+'%' : '—');
  html += stat('Highest score', a.highScore != null ? fmtMarks(a.highScore) : '—');
  html += stat('Lowest score', a.lowScore != null ? fmtMarks(a.lowScore) : '—');
  html += stat('Avg. active time', a.avgTotalTime != null ? fmtDurA(a.avgTotalTime) : 'No timing data');
  html += '</div>';

  if(!a.submitted){
    box.innerHTML = html + '<div class="empty-state" style="margin-top:14px">No submitted attempts yet for this test.</div>';
    return;
  }
  if(!a.engine){
    box.innerHTML = html + '<div class="empty-state" style="margin-top:14px">Question-wise analytics isn\u2019t available for this test — it was saved in the older format without structured questions.</div>';
    return;
  }

  const answered = a.questions.filter(q => q.sampleSize > 0);
  const toughest = answered.slice().sort((x,y) => x.pct - y.pct).slice(0,3);
  if(toughest.length){
    html += '<div class="card-title" style="margin-top:16px;font-size:13px">⚠️ Toughest questions</div>';
    html += '<div class="item-meta" style="margin-bottom:8px">Lowest correct-answer rate first</div>';
    toughest.forEach(q => { html += `<div class="item-meta">Q${q.index+1} — ${q.pct}% correct (${q.sampleSize} answered)</div>`; });
  }

  html += '<div class="card-title" style="margin-top:16px;font-size:13px">Question-wise breakdown</div>';
  a.questions.forEach(q => {
    const low = q.pct != null && q.pct < 50;
    html += `<div class="q-stat-card">
      <div class="q-stat-head">
        <div class="q-stat-num">Q${q.index+1}${low ? ' <span class="q-stat-flag">⚠️ Frequently missed</span>' : ''}</div>
        <div class="q-stat-pct">${q.pct != null ? q.pct+'% correct' : 'No answers yet'}</div>
      </div>
      <div class="q-stat-preview">${esc(q.preview)}</div>
      <div class="q-stat-bar"><div class="q-stat-bar-fill" style="width:${q.pct != null ? q.pct : 0}%"></div></div>
      <div class="item-meta">✓ ${q.correct} correct · ✗ ${q.wrong} wrong · — ${q.unans} unanswered${q.avgTime != null ? ' · ⏱ avg '+fmtDurA(q.avgTime) : ' · No timing data'}</div>
    </div>`;
  });

  box.innerHTML = html;
}


function drawManualBuilder(body, onPublished){
  let questions = [];
  body.appendChild(el(`<div>
    <div class="card compact-fields">
      <div class="card-title">📋 Test details</div>
      <div class="field"><label>Title</label><input id="mTitle" placeholder="Full Test - 01"></div>
      <div class="row2">
        <div class="field"><label>Subject</label><input id="mSubject" placeholder="Physics"></div>
        <div class="field"><label>Batch</label><select id="mBatch"><option value="">Select batch...</option></select></div>
      </div>
      <div class="row2">
        <div class="field"><label>Type</label><select id="mType"><option value="live">🔴 Live</option><option value="selfpaced">⏱ Regular</option><option value="practice" selected>📚 Practice (no timer)</option></select></div>
        <div class="field"><label>Duration (mins, 0 = no timer)</label><input type="number" id="mDuration" value="30"></div>
      </div>
      <div class="row2" id="mLiveBox" style="display:none">
        <div class="field"><label>Live starts (date &amp; time)</label><input type="datetime-local" id="mLiveStart"></div>
        <div class="field"><label>Live ends (date &amp; time)</label><input type="datetime-local" id="mLiveEnd"></div>
      </div>
      <div class="row2">
        <div class="field"><label>Correct marks</label><input type="number" id="mCorrect" value="4"></div>
        <div class="field"><label>Wrong marks</label><input type="number" id="mWrong" value="-1"></div>
      </div>
      <div class="field"><label>Answer button layout (applies to the whole test)</label>
        <select id="mLayout">
          <option value="grid2x2" selected>2 × 2 grid</option>
          <option value="horizontal">Horizontal (A B C D in a row)</option>
          <option value="vertical">Vertical (stacked)</option>
        </select>
      </div>
    </div>
    <div class="card">
      <div class="card-title">❓ Questions <span id="qCountLbl" style="color:var(--text-dim);font-weight:400;font-size:11px">(0 added)</span></div>
      <div id="mQList"></div>
      <div class="field"><label>Question text (optional) — supports $LaTeX$, &lt;img src="..."&gt;, raw &lt;svg&gt;</label>
        <textarea id="mQText" placeholder="Leave blank if the image below already contains the full question."></textarea>
      </div>
      <div class="field"><label>Question image URL (optional — Google Drive share links supported)</label>
        <input id="mQImage" placeholder="https://drive.google.com/file/d/.../view">
        <img id="mQImagePreview" style="display:none;max-width:100%;max-height:160px;border-radius:8px;margin-top:8px" onload="this.style.display='block'" onerror="this.style.display='none'">
      </div>
      <div class="row2">
        <div class="field"><label>Option A (optional)</label><input id="mOptA"></div>
        <div class="field"><label>Option B (optional)</label><input id="mOptB"></div>
      </div>
      <div class="row2">
        <div class="field"><label>Option C (optional)</label><input id="mOptC"></div>
        <div class="field"><label>Option D (optional)</label><input id="mOptD"></div>
      </div>
      <div class="field hint" style="margin-top:-4px;margin-bottom:10px">Leave all four blank if the options are already shown inside the question image — students will still see tappable A/B/C/D buttons.</div>
      <div class="field"><label>Correct option</label><select id="mCorrectOpt"><option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select></div>
      <div class="field"><label>Explanation text (optional, shown after submit)</label><textarea id="mExplainText" placeholder="Why this is the correct answer..."></textarea></div>
      <div class="field"><label>Explanation image URL (optional)</label>
        <input id="mExplainImage" placeholder="https://drive.google.com/file/d/.../view">
        <img id="mExplainImagePreview" style="display:none;max-width:100%;max-height:160px;border-radius:8px;margin-top:8px" onload="this.style.display='block'" onerror="this.style.display='none'">
      </div>
      <button class="btn btn-ghost" id="addQ">+ Add question</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-ghost" id="previewManual">👁 Preview</button>
      <button class="btn btn-primary" id="publishManual">🚀 Generate &amp; publish test</button>
    </div>
  </div>`));
  loadActiveBatchesInto($('#mBatch', body));
  $('#mType',body).addEventListener('change', ()=>{ $('#mLiveBox',body).style.display = $('#mType',body).value==='live' ? '' : 'none'; });

  // Live admin-side preview for pasted image URLs — reuses the same
  // resolveImageUrl() Drive-link resolver already used by banners/notes,
  // so a Drive share link previews correctly here too.
  function wireImagePreview(inputId, imgId){
    const input = $('#'+inputId, body), img = $('#'+imgId, body);
    input.addEventListener('input', ()=>{
      const url = input.value.trim();
      if(!url){ img.style.display='none'; img.removeAttribute('src'); return; }
      img.src = resolveImageUrl(url);
    });
  }
  wireImagePreview('mQImage','mQImagePreview');
  wireImagePreview('mExplainImage','mExplainImagePreview');

  function refreshQList(){
    $('#qCountLbl',body).textContent = '('+questions.length+' added)';
    const box = $('#mQList',body); box.innerHTML='';
    questions.forEach((q,i)=>{
      const label = q.text ? (q.text.slice(0,40)+(q.text.length>40?'…':'')) : (q.imageUrl ? '[Image question]' : '[Untitled question]');
      const row = el(`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border-soft);font-size:12px">
        <span>Q${i+1}. ${esc(label)}${q.imageUrl?' 🖼':''}</span><button class="btn-sm btn-danger" aria-label="Remove question">${icon('trash',14)}</button></div>`);
      $('button',row).addEventListener('click', ()=>{ questions.splice(i,1); refreshQList(); });
      box.appendChild(row);
    });
  }
  $('#addQ',body).addEventListener('click', ()=>{
    const text = $('#mQText',body).value.trim();
    const imageUrlRaw = $('#mQImage',body).value.trim();
    const imageUrl = imageUrlRaw ? resolveImageUrl(imageUrlRaw) : '';
    if(!text && !imageUrl){ toast('Add question text or an image — at least one is required'); return; }
    const options = [$('#mOptA',body).value.trim(), $('#mOptB',body).value.trim(), $('#mOptC',body).value.trim(), $('#mOptD',body).value.trim()];
    const explainImageRaw = $('#mExplainImage',body).value.trim();
    questions.push({
      text, imageUrl,
      options,
      correct: parseInt($('#mCorrectOpt',body).value),
      explainText: $('#mExplainText',body).value.trim(),
      explainImageUrl: explainImageRaw ? resolveImageUrl(explainImageRaw) : ''
    });
    $('#mQText',body).value=''; $('#mQImage',body).value='';
    $('#mOptA',body).value=''; $('#mOptB',body).value=''; $('#mOptC',body).value=''; $('#mOptD',body).value='';
    $('#mCorrectOpt',body).value='0';
    $('#mExplainText',body).value=''; $('#mExplainImage',body).value='';
    $('#mQImagePreview',body).style.display='none'; $('#mExplainImagePreview',body).style.display='none';
    refreshQList(); toast('Question added');
  });
  $('#previewManual',body).addEventListener('click', ()=>{
    if(!questions.length){ toast('Add at least one question to preview'); return; }
    openTestPreview({
      title: $('#mTitle',body).value.trim(), subject: $('#mSubject',body).value.trim(), questions,
      meta: { correctMark: parseFloat($('#mCorrect',body).value)||0, wrongMark: parseFloat($('#mWrong',body).value)||0,
              duration: parseInt($('#mDuration',body).value)||0, answerButtonLayout: $('#mLayout',body).value }
    });
  });
  $('#publishManual',body).addEventListener('click', async ()=>{
    const title = $('#mTitle',body).value.trim();
    const batchSel = $('#mBatch',body);
    const batchId = batchSel.value;
    const subject = $('#mSubject',body).value.trim();
    const type = $('#mType',body).value;
    const v = validateTestDraft({ title, subject, batchId, type, questions,
      correctMarkRaw: $('#mCorrect',body).value, wrongMarkRaw: $('#mWrong',body).value, durationRaw: $('#mDuration',body).value,
      liveStartRaw: $('#mLiveStart',body).value, liveEndRaw: $('#mLiveEnd',body).value });
    if(!await confirmDraftIssues(v, 'Publish anyway')) return;
    const batchName = batchId === GENERAL_BATCH_ID ? 'Free Demo' : batchSel.selectedOptions[0].textContent;
    const answerButtonLayout = $('#mLayout',body).value;
    const meta = {
      title, subject,
      correctMark: parseFloat($('#mCorrect',body).value)||0,
      wrongMark: parseFloat($('#mWrong',body).value)||0,
      duration: parseInt($('#mDuration',body).value)||0,
      answerButtonLayout
    };
    const live = readLiveSchedule(type, $('#mLiveStart',body).value, $('#mLiveEnd',body).value);
    if(live.error){ toast(live.error); return; }
    if(!await publishNormalizedTest({ title, subject, batchId, batchName, type, meta, questions, live })) return;
    questions = []; refreshQList(); $('#mTitle',body).value=''; batchSel.value='';
    if(onPublished) onPublished();
  });
}

/* ---------- Phase 2: shared publish path (Manual Builder + Text Generator) ---------- */
function readLiveSchedule(type, sVal, eVal){
  if(type !== 'live') return { start:null, end:null };
  if(!sVal || !eVal) return { error:'Live tests need a start and an end date & time.' };
  const s = new Date(sVal).getTime(), e = new Date(eVal).getTime();
  if(isNaN(s) || isNaN(e)) return { error:'Enter a valid live start and end time.' };
  if(s >= e) return { error:'Live start must be earlier than live end.' };
  return { start:s, end:e };
}
const TEST_MAX_QUESTIONS = 100, TEST_MAX_BYTES = 900000;

/* ---------- Pre-publish validation (shared by Manual Builder, Text Generator, Edit/Duplicate) ----------
   One canonical checker so the three entry points can't drift apart. It only READS the draft —
   nothing is ever silently corrected. Reuses readLiveSchedule() for the Live schedule rules (so
   Practice/Regular never see Live-specific errors) and the same question-validity predicate
   buildTestDef() applies at play time (options array + integer correct 0..3), plus the
   "text or image" rule the builders already enforce when a question is added.
   Returns { errors, warnings }: errors block publishing; warnings can be published past. */
function validateTestDraft(o){
  const errors = [], warnings = [];
  const blank = v => v === '' || v == null;
  if(!String(o.title || '').trim()) errors.push('Enter a test title.');
  if(!o.batchId) errors.push('Select a batch.');
  if(!String(o.subject || '').trim()) warnings.push('No subject entered — subject filters won\u2019t group this test.');

  const c = blank(o.correctMarkRaw) ? NaN : Number(o.correctMarkRaw);
  if(!Number.isFinite(c) || c <= 0) errors.push('Marks per correct answer must be a number greater than 0.');
  if(!blank(o.wrongMarkRaw) && !Number.isFinite(Number(o.wrongMarkRaw))) errors.push('Negative marks must be a number (use 0 for no negative marking).');
  if(!blank(o.durationRaw)){
    const d = Number(o.durationRaw);
    if(!Number.isFinite(d) || d < 0) errors.push('Duration must be 0 (no timer) or a positive number of minutes.');
  }
  if(o.type === 'live'){
    const live = readLiveSchedule('live', o.liveStartRaw, o.liveEndRaw);
    if(live.error) errors.push(live.error);
  }

  const qs = Array.isArray(o.questions) ? o.questions : [];
  if(!qs.length) errors.push('Add at least one question.');
  const L = ['A','B','C','D'];
  qs.forEach((q, i) => {
    const n = 'Q' + (i+1) + ': ';
    if(!q || typeof q !== 'object'){ errors.push(n + 'question data is broken — remove and re-add it.'); return; }
    if(!String(q.text || '').trim() && !String(q.imageUrl || '').trim()) errors.push(n + 'has no question text or image.');
    if(!Array.isArray(q.options) || q.options.length !== 4){ errors.push(n + 'needs four option slots (A–D).'); return; }
    if(!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3){ errors.push(n + 'correct answer is missing or invalid.'); return; }
    // All four blank is allowed on purpose (options shown inside the question image). If ANY
    // option has text, the marked correct one must too — otherwise the key points at nothing.
    const anyOpt = q.options.some(x => String(x || '').trim());
    if(anyOpt && !String(q.options[q.correct] || '').trim()) errors.push(n + 'the marked correct option (' + L[q.correct] + ') is empty.');
  });
  return { errors, warnings };
}
function showValidationErrors(errors){
  return new Promise(resolve => {
    const shown = errors.slice(0, 15);
    const ov = el(`<div class="overlay open" style="align-items:center;z-index:1200"><div class="sheet" style="border-radius:16px;max-width:380px;padding:20px 18px;transform:none;max-height:80vh;overflow-y:auto">
      <div style="font-size:15px;font-weight:700;line-height:1.4;margin-bottom:10px">Fix these before publishing (${errors.length})</div>
      ${shown.map(e => `<div style="font-size:13px;color:var(--danger);line-height:1.5;margin-bottom:6px">• ${esc(e)}</div>`).join('')}
      ${errors.length > shown.length ? `<div style="font-size:12px;color:var(--text-dim)">…and ${errors.length - shown.length} more.</div>` : ''}
      <div style="margin-top:14px"><button class="btn btn-primary" type="button" data-ok>OK</button></div></div></div>`);
    document.body.appendChild(ov);
    $('[data-ok]', ov).addEventListener('click', () => { ov.remove(); resolve(); });
  });
}
/* Runs the validator's result through the UI. Resolves true only if it's OK to go ahead:
   errors always stop it; warnings ask first (reusing the existing confirm sheet). */
async function confirmDraftIssues(v, proceedLabel){
  if(v.errors.length){ await showValidationErrors(v.errors); return false; }
  if(v.warnings.length) return adminConfirmSheet({ title:'Before you continue', lines:v.warnings, cancel:'Go back', confirm: proceedLabel || 'Continue' });
  return true;
}
async function publishNormalizedTest(o){
  const { title, subject, batchId, batchName, type, meta, questions, live } = o;
  // Only definition data is stored, once, as structured questions[] (same field names the engine reads).
  // The player page is built at runtime by buildTestHTML(); no htmlContent blob is saved for new tests.
  const stored = questions.map(q => ({ text:q.text, imageUrl:q.imageUrl, options:q.options, correct:q.correct, explainText:q.explainText, explainImageUrl:q.explainImageUrl }));
  if(new Blob([JSON.stringify(stored)]).size > TEST_MAX_BYTES){
    toast('This test is too large to store safely (about 900 KB limit). Shorten the text or remove images, or split it into two tests. Nothing was saved.');
    return false;
  }
  const docData = {
    title, subject, batchId, batchName, type,
    duration: meta.duration, questionCount: questions.length, answerButtonLayout: meta.answerButtonLayout,
    marksPerQuestion: meta.correctMark,
    negativeMarksPerQuestion: Math.max(0, -meta.wrongMark),
    totalMarks: Math.round(questions.length * meta.correctMark * 100) / 100,
    durationMinutes: meta.duration,
    questions: stored, source: o.source || 'manual',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if(live && live.start != null){
    docData.liveStartAt = firebase.firestore.Timestamp.fromMillis(live.start);
    docData.liveEndAt = firebase.firestore.Timestamp.fromMillis(live.end);
  }
  await db.collection(COL.tests).add(docData);
  toast('✅ Test published to Firebase!');
  return true;
}

/* ---------- Phase 2: Edit Test + Duplicate Test ----------
   Edit/Duplicate only ever operate on tests that already carry a structured
   top-level questions[] array (the new architecture). Legacy tests — pasted
   HTML, or older Manual Builder tests that only have QUESTIONS embedded in
   htmlContent — get neither button (see renderAdminTests) and are left
   exactly as they are; this app is still pre-production and those documents
   are not worth carrying extra migration/compatibility complexity for. */

function msToLocalInput(ms){
  if(ms == null) return '';
  const d = new Date(ms), pad = n => String(n).padStart(2,'0');
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
}

/* A test is historically locked once at least one Live/Regular attempt has been
   SUBMITTED — an in-progress attempt alone does not lock it. Practice never locks:
   it never writes testAttempts, so there is nothing to check. */
async function hasCompletedAttempts(testId){
  const snap = await db.collection(COL.testAttempts).where('testId','==',testId).where('status','==','completed').limit(1).get();
  return !snap.empty;
}

/* Same field set/shape as publishNormalizedTest, but updates an existing test
   document in place instead of creating one. Only ever called on a test that
   is NOT historically locked, so every field below is safe to overwrite. */
async function updateNormalizedTest(testId, o){
  const { title, subject, batchId, batchName, type, meta, questions, live } = o;
  const stored = questions.map(q => ({ text:q.text, imageUrl:q.imageUrl, options:q.options, correct:q.correct, explainText:q.explainText, explainImageUrl:q.explainImageUrl }));
  if(new Blob([JSON.stringify(stored)]).size > TEST_MAX_BYTES){
    toast('This test is too large to store safely (about 900 KB limit). Shorten the text or remove images, or split it into two tests. Nothing was saved.');
    return false;
  }
  const docData = {
    title, subject, batchId, batchName, type,
    duration: meta.duration, questionCount: questions.length, answerButtonLayout: meta.answerButtonLayout,
    marksPerQuestion: meta.correctMark,
    negativeMarksPerQuestion: Math.max(0, -meta.wrongMark),
    totalMarks: Math.round(questions.length * meta.correctMark * 100) / 100,
    durationMinutes: meta.duration,
    questions: stored,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  docData.liveStartAt = (live && live.start != null) ? firebase.firestore.Timestamp.fromMillis(live.start) : firebase.firestore.FieldValue.delete();
  docData.liveEndAt   = (live && live.end   != null) ? firebase.firestore.Timestamp.fromMillis(live.end)   : firebase.firestore.FieldValue.delete();
  await db.collection(COL.tests).doc(testId).update(docData);
  toast('✅ Test updated');
  return true;
}

/* Fields that stay editable even after a test is historically locked — purely
   descriptive/cosmetic, so changing them cannot affect scoring, question
   meaning/order, timing, historical review, or attempt validity. Everything
   else (batch, type, schedule, duration, marks, questions) is locked. */
async function updateSafeMetadataOnly(testId, { title, subject, answerButtonLayout }){
  await db.collection(COL.tests).doc(testId).update({ title, subject, answerButtonLayout, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  toast('✅ Test updated');
  return true;
}

function openEditTestSheet(t, opts){
  const dup = !!(opts && opts.duplicate);
  const overlay = el(`<div class="overlay open"><div class="sheet" style="max-height:94vh;overflow-y:auto">
    <div class="sheet-handle"></div><button class="sheet-close" id="eClose">✕</button><div style="clear:both"></div>
    <div class="card-title">${dup ? '📄 Duplicate test' : '✏️ Edit test'}</div>
    <div id="eBody"><div class="spinner"></div></div>
  </div></div>`);
  document.body.appendChild(overlay);
  $('#eClose', overlay).addEventListener('click', ()=> overlay.remove());
  const eBody = $('#eBody', overlay);

  (async () => {
    const locked = dup ? false : (testKind(t) === 'practice' ? false : await hasCompletedAttempts(t.id).catch(()=>false));
    eBody.innerHTML = '';

    if(locked){
      eBody.appendChild(el(`<div class="card" style="border-color:var(--warning,#f59e0b)">
        <div style="display:flex;gap:8px;align-items:flex-start"><span style="flex-shrink:0">${icon('lock',18)}</span>
        <div style="font-size:12px;line-height:1.6">This test already has submitted attempts. Question content, scoring, timing, batch, type and the live schedule are locked to preserve historical results — only the title, subject and answer layout can still be changed. Use <b>Duplicate</b> to create an editable copy for a revised version.</div></div>
      </div>`));
    }

    eBody.appendChild(el(`<div>
      <div class="card">
        <div class="card-title">📋 Test details</div>
        <div class="field"><label>Title</label><input id="eTitle" value="${esc(dup ? (t.title||'') + ' — Copy' : (t.title||''))}"></div>
        <div class="row2">
          <div class="field"><label>Subject</label><input id="eSubject" value="${esc(t.subject||'')}"></div>
          <div class="field"><label>Batch</label><select id="eBatch" ${locked?'disabled':''}></select></div>
        </div>
        <div class="row2">
          <div class="field"><label>Type</label><select id="eType" ${locked?'disabled':''}>
            <option value="live">🔴 Live</option><option value="selfpaced">⏱ Regular</option><option value="practice">📚 Practice (no timer)</option>
          </select></div>
          <div class="field"><label>Duration (mins, 0 = no timer)</label><input type="number" id="eDuration" value="${esc(t.durationMinutes ?? t.duration ?? 30)}" ${locked?'disabled':''}></div>
        </div>
        <div class="row2" id="eLiveBox" style="display:none">
          <div class="field"><label>Live starts (date &amp; time)</label><input type="datetime-local" id="eLiveStart" ${locked?'disabled':''}></div>
          <div class="field"><label>Live ends (date &amp; time)</label><input type="datetime-local" id="eLiveEnd" ${locked?'disabled':''}></div>
        </div>
        ${dup ? `<div class="field hint" id="eLiveDupHint" style="display:none;margin-top:-6px">This is a copy — set a fresh live schedule before publishing it.</div>` : ''}
        <div class="row2">
          <div class="field"><label>Correct marks</label><input type="number" id="eCorrect" value="${esc(t.marksPerQuestion ?? 4)}" ${locked?'disabled':''}></div>
          <div class="field"><label>Wrong marks</label><input type="number" id="eWrong" value="${esc(-(t.negativeMarksPerQuestion ?? 0))}" ${locked?'disabled':''}></div>
        </div>
        <div class="field"><label>Answer button layout</label>
          <select id="eLayout">
            <option value="grid2x2">2 × 2 grid</option><option value="horizontal">Horizontal (A B C D in a row)</option><option value="vertical">Vertical (stacked)</option>
          </select>
        </div>
      </div>
      <div class="card" id="eQCard" ${locked?'style="display:none"':''}>
        <div class="card-title">❓ Questions <span id="eQCountLbl" style="color:var(--text-dim);font-weight:400;font-size:11px"></span></div>
        <div id="eQList"></div>
        <div class="field"><label>Question text (optional) — supports $LaTeX$, &lt;img src="..."&gt;, raw &lt;svg&gt;</label>
          <textarea id="eQText" placeholder="Leave blank if the image below already contains the full question."></textarea>
        </div>
        <div class="field"><label>Question image URL (optional — Google Drive share links supported)</label>
          <input id="eQImage" placeholder="https://drive.google.com/file/d/.../view">
          <img id="eQImagePreview" style="display:none;max-width:100%;max-height:160px;border-radius:8px;margin-top:8px" onload="this.style.display='block'" onerror="this.style.display='none'">
        </div>
        <div class="row2">
          <div class="field"><label>Option A (optional)</label><input id="eOptA"></div>
          <div class="field"><label>Option B (optional)</label><input id="eOptB"></div>
        </div>
        <div class="row2">
          <div class="field"><label>Option C (optional)</label><input id="eOptC"></div>
          <div class="field"><label>Option D (optional)</label><input id="eOptD"></div>
        </div>
        <div class="field"><label>Correct option</label><select id="eCorrectOpt"><option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select></div>
        <div class="field"><label>Explanation text (optional, shown after submit)</label><textarea id="eExplainText"></textarea></div>
        <div class="field"><label>Explanation image URL (optional)</label>
          <input id="eExplainImage" placeholder="https://drive.google.com/file/d/.../view">
          <img id="eExplainImagePreview" style="display:none;max-width:100%;max-height:160px;border-radius:8px;margin-top:8px" onload="this.style.display='block'" onerror="this.style.display='none'">
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-ghost" id="eAddQ">+ Add question</button>
          <button class="btn btn-ghost" id="eCancelEdit" style="display:none">Cancel edit</button>
        </div>
      </div>
      ${locked ? `<div class="card"><div class="card-title">❓ Questions <span style="color:var(--text-dim);font-weight:400;font-size:11px">(${(t.questions||[]).length} — locked)</span></div>
        <div style="font-size:12px;color:var(--text-muted)">Duplicate this test to edit its questions.</div></div>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${locked ? '' : '<button class="btn btn-ghost" id="ePreview">👁 Preview</button>'}
        <button class="btn btn-primary" id="eSave">${dup ? '📄 Create duplicate' : '💾 Save changes'}</button>
      </div>
    </div>`));

    const typeSel = $('#eType', overlay);
    typeSel.value = (t.type === 'selfpaced' || t.type === 'regular') ? 'selfpaced' : (t.type === 'live' ? 'live' : 'practice');
    $('#eLayout', overlay).value = t.answerButtonLayout || 'grid2x2';

    const batchSel = $('#eBatch', overlay);
    loadActiveBatchesInto(batchSel).then(()=>{ batchSel.value = t.batchId || GENERAL_BATCH_ID; });

    function syncLiveBox(){
      const isLive = typeSel.value === 'live';
      $('#eLiveBox', overlay).style.display = isLive ? '' : 'none';
      const hint = $('#eLiveDupHint', overlay); if(hint) hint.style.display = (isLive && dup) ? '' : 'none';
    }
    typeSel.addEventListener('change', syncLiveBox);
    syncLiveBox();
    if(!dup && t.type === 'live'){
      $('#eLiveStart', overlay).value = msToLocalInput(tsToMs(t.liveStartAt));
      $('#eLiveEnd', overlay).value = msToLocalInput(tsToMs(t.liveEndAt));
    }
    // A duplicate never inherits the old schedule — always confirmed fresh (see spec §13).

    if(locked){
      $('#eSave',overlay).addEventListener('click', async ()=>{
        const title = $('#eTitle',overlay).value.trim();
        if(!title){ toast('Enter a test title'); return; }
        const ok = await updateSafeMetadataOnly(t.id, { title, subject: $('#eSubject',overlay).value.trim(), answerButtonLayout: $('#eLayout',overlay).value });
        if(ok) overlay.remove();
      });
      return; // nothing below this point is reachable when fields are disabled/hidden
    }

    let questions = (t.questions || []).map(q => ({ ...q, options: (q.options||[]).slice(0,4) }));
    let editingIndex = null;

    function wireImagePreview(inputId, imgId){
      const input = $('#'+inputId, overlay), img = $('#'+imgId, overlay);
      input.addEventListener('input', ()=>{
        const url = input.value.trim();
        if(!url){ img.style.display='none'; img.removeAttribute('src'); return; }
        img.src = resolveImageUrl(url);
      });
    }
    wireImagePreview('eQImage','eQImagePreview');
    wireImagePreview('eExplainImage','eExplainImagePreview');

    function clearStagingForm(){
      $('#eQText',overlay).value=''; $('#eQImage',overlay).value='';
      $('#eOptA',overlay).value=''; $('#eOptB',overlay).value=''; $('#eOptC',overlay).value=''; $('#eOptD',overlay).value='';
      $('#eCorrectOpt',overlay).value='0';
      $('#eExplainText',overlay).value=''; $('#eExplainImage',overlay).value='';
      $('#eQImagePreview',overlay).style.display='none'; $('#eExplainImagePreview',overlay).style.display='none';
      editingIndex = null;
      $('#eAddQ',overlay).textContent = '+ Add question';
      $('#eCancelEdit',overlay).style.display = 'none';
    }

    function refreshQList(){
      $('#eQCountLbl',overlay).textContent = '('+questions.length+' added)';
      const box = $('#eQList',overlay); box.innerHTML='';
      questions.forEach((q,i)=>{
        const label = q.text ? (q.text.slice(0,40)+(q.text.length>40?'…':'')) : (q.imageUrl ? '[Image question]' : '[Untitled question]');
        const row = el(`<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;padding:7px 0;border-bottom:1px solid var(--border-soft);font-size:12px">
          <span>Q${i+1}. ${esc(label)}${q.imageUrl?' 🖼':''}</span>
          <span style="display:flex;gap:4px;flex-shrink:0">
            <button class="btn-sm btn-ghost" type="button" data-edit aria-label="Edit question">${icon('edit',14)}</button>
            <button class="btn-sm btn-danger" type="button" data-del aria-label="Remove question">${icon('trash',14)}</button>
          </span></div>`);
        $('[data-del]',row).addEventListener('click', ()=>{
          questions.splice(i,1);
          if(editingIndex === i) clearStagingForm(); else if(editingIndex != null && editingIndex > i) editingIndex--;
          refreshQList();
        });
        $('[data-edit]',row).addEventListener('click', ()=>{
          editingIndex = i;
          $('#eQText',overlay).value = q.text||''; $('#eQImage',overlay).value = q.imageUrl||'';
          $('#eOptA',overlay).value = q.options?.[0]||''; $('#eOptB',overlay).value = q.options?.[1]||'';
          $('#eOptC',overlay).value = q.options?.[2]||''; $('#eOptD',overlay).value = q.options?.[3]||'';
          $('#eCorrectOpt',overlay).value = String(q.correct ?? 0);
          $('#eExplainText',overlay).value = q.explainText||''; $('#eExplainImage',overlay).value = q.explainImageUrl||'';
          $('#eQImagePreview',overlay).style.display = q.imageUrl ? 'block':'none'; if(q.imageUrl) $('#eQImagePreview',overlay).src = resolveImageUrl(q.imageUrl);
          $('#eExplainImagePreview',overlay).style.display = q.explainImageUrl ? 'block':'none'; if(q.explainImageUrl) $('#eExplainImagePreview',overlay).src = resolveImageUrl(q.explainImageUrl);
          $('#eAddQ',overlay).textContent = 'Update Q'+(i+1);
          $('#eCancelEdit',overlay).style.display = '';
          box.scrollIntoView({ block:'nearest' });
        });
        box.appendChild(row);
      });
    }
    refreshQList();
    $('#eCancelEdit',overlay).addEventListener('click', clearStagingForm);
    $('#eAddQ',overlay).addEventListener('click', ()=>{
      const text = $('#eQText',overlay).value.trim();
      const imageUrlRaw = $('#eQImage',overlay).value.trim();
      const imageUrl = imageUrlRaw ? resolveImageUrl(imageUrlRaw) : '';
      if(!text && !imageUrl){ toast('Add question text or an image — at least one is required'); return; }
      const q = {
        text, imageUrl,
        options: [$('#eOptA',overlay).value.trim(), $('#eOptB',overlay).value.trim(), $('#eOptC',overlay).value.trim(), $('#eOptD',overlay).value.trim()],
        correct: parseInt($('#eCorrectOpt',overlay).value),
        explainText: $('#eExplainText',overlay).value.trim(),
        explainImageUrl: (()=>{ const r = $('#eExplainImage',overlay).value.trim(); return r ? resolveImageUrl(r) : ''; })()
      };
      if(editingIndex != null) questions[editingIndex] = q; else questions.push(q);
      clearStagingForm(); refreshQList();
      toast(editingIndex != null ? 'Question updated' : 'Question added');
    });

    $('#ePreview',overlay).addEventListener('click', ()=>{
      if(!questions.length){ toast('Add at least one question to preview'); return; }
      openTestPreview({
        title: $('#eTitle',overlay).value.trim(), subject: $('#eSubject',overlay).value.trim(), questions,
        meta: { correctMark: parseFloat($('#eCorrect',overlay).value)||0, wrongMark: parseFloat($('#eWrong',overlay).value)||0,
                duration: parseInt($('#eDuration',overlay).value)||0, answerButtonLayout: $('#eLayout',overlay).value }
      });
    });
    $('#eSave',overlay).addEventListener('click', async ()=>{
      const title = $('#eTitle',overlay).value.trim();
      const batchId = batchSel.value;
      const subject = $('#eSubject',overlay).value.trim();
      const type = typeSel.value;
      const v = validateTestDraft({ title, subject, batchId, type, questions,
        correctMarkRaw: $('#eCorrect',overlay).value, wrongMarkRaw: $('#eWrong',overlay).value, durationRaw: $('#eDuration',overlay).value,
        liveStartRaw: $('#eLiveStart',overlay).value, liveEndRaw: $('#eLiveEnd',overlay).value });
      if(!await confirmDraftIssues(v, dup ? 'Create anyway' : 'Save anyway')) return;
      const batchName = batchId === GENERAL_BATCH_ID ? 'Free Demo' : batchSel.selectedOptions[0].textContent;
      const answerButtonLayout = $('#eLayout',overlay).value;
      const meta = {
        title, subject,
        correctMark: parseFloat($('#eCorrect',overlay).value)||0,
        wrongMark: parseFloat($('#eWrong',overlay).value)||0,
        duration: parseInt($('#eDuration',overlay).value)||0,
        answerButtonLayout
      };
      const live = readLiveSchedule(type, $('#eLiveStart',overlay).value, $('#eLiveEnd',overlay).value);
      if(live.error){ toast(live.error); return; }
      const ok = dup
        ? await publishNormalizedTest({ title, subject, batchId, batchName, type, meta, questions, live, source:'duplicate' })
        : await updateNormalizedTest(t.id, { title, subject, batchId, batchName, type, meta, questions, live });
      if(ok) overlay.remove();
    });
  })();
}

/* ---------- Phase 2: Text Test Generator parser (runs entirely in the browser) ----------
   Returns { questions, errors }. Questions use the same shape as the Manual Builder. */
function parseTestText(raw){
  const errors = [], blocks = [];
  const qRe = /^\s*Q\s*(\d+)\s*[.):\-]\s*(.*)$/i;
  const keyRe = /^\s*(Answer|Ans|Explanation|Question\s*Image|Explanation\s*Image)\s*:\s*(.*)$/i;
  const optRe = /^\s*\(?([A-Da-d])[.)]\s*(.*)$/;
  let b = null, cur = null, warnedPre = false;
  String(raw || '').replace(/\r/g,'').split('\n').forEach((line, ln) => {
    const qm = line.match(qRe);
    if(qm){ b = { num:+qm[1], text:[qm[2]], opts:{}, ans:null, exp:[], qimg:null, eimg:null, dup:[] }; blocks.push(b); cur = 'q'; return; }
    if(!line.trim() && !b) return;
    if(!b){ if(!warnedPre){ errors.push('Line ' + (ln+1) + ': text found before Q1. Start every question with Q1., Q2., Q3. …'); warnedPre = true; } return; }
    const km = line.match(keyRe);
    if(km){
      const k = km[1].toLowerCase().replace(/\s+/g,''), v = km[2].trim();
      const f = k === 'answer' || k === 'ans' ? 'ans' : k === 'explanation' ? 'exp' : k === 'questionimage' ? 'qimg' : 'eimg';
      if((f === 'exp' ? b.exp.some(x=>x) : b[f] !== null)) b.dup.push(km[1]);
      if(f === 'exp') b.exp = [v]; else b[f] = v;
      cur = f; return;
    }
    const om = (cur === 'q' || 'ABCD'.includes(cur)) ? line.match(optRe) : null;
    if(om){
      const L = om[1].toUpperCase();
      if(b.opts[L] !== undefined) b.dup.push('option ' + L);
      b.opts[L] = om[2].trim(); cur = L; return;
    }
    if(cur === 'q') b.text.push(line.trim());
    else if(cur === 'exp') b.exp.push(line.trim());
    else if('ABCD'.includes(cur) && line.trim()) b.opts[cur] += ' ' + line.trim();
  });
  if(!blocks.length) errors.push('No questions found. Start every question with Q1., Q2., Q3. …');
  if(blocks.length > TEST_MAX_QUESTIONS) errors.push('Too many questions (' + blocks.length + '). The limit is ' + TEST_MAX_QUESTIONS + ' per test.');
  const questions = [], urlOk = u => /^https?:\/\/\S+$/i.test(u);
  blocks.forEach((q, idx) => {
    const L = 'Q' + q.num + ': ', e = m => errors.push(L + m);
    if(q.num !== idx + 1) e('question numbering must run 1, 2, 3 … (expected Q' + (idx+1) + ' here).');
    q.dup.forEach(d => e('"' + d + '" appears more than once.'));
    let text = q.text.join('\n').replace(/\n{3,}/g,'\n\n').trim();
    let qimg = (q.qimg || '').trim();
    let explainText = q.exp.join('\n').trim();
    let eimg = (q.eimg || '').trim();
    // A question/explanation typed as nothing but a bare link (no "Question Image:"/
    // "Explanation Image:" label used) is still meant as an image, not literal text —
    // Manual Builder's image field accepts a raw link the same way, with no label at
    // all, so the Text Generator should treat one exactly the same instead of showing
    // the link as flat text.
    const bareUrl = s => { const m = /^(https?:\/\/\S+)$/i.exec(s); return m ? m[1] : null; };
    if(!qimg){ const b = bareUrl(text); if(b){ qimg = b; text = ''; } }
    if(!eimg){ const b = bareUrl(explainText); if(b){ eimg = b; explainText = ''; } }
    if(!text && !qimg) e('missing question text or Question Image.');
    if(qimg && !urlOk(qimg)) e('Question Image must be a full http(s) link.');
    if(eimg && !urlOk(eimg)) e('Explanation Image must be a full http(s) link.');
    const have = 'ABCD'.split('').filter(l => (q.opts[l] || '').trim());
    if(!(have.length === 0 && qimg)) 'ABCD'.split('').forEach(l => { if(!have.includes(l)) e('missing option ' + l + '.'); });
    let correct = -1;
    if(q.ans === null || q.ans === '') e('missing Answer.');
    else { const am = q.ans.trim().match(/^\(?([A-Da-d])\)?\.?$/); if(am) correct = 'ABCD'.indexOf(am[1].toUpperCase()); else e('Answer must be A, B, C or D.'); }
    questions.push({
      text, imageUrl: qimg && urlOk(qimg) ? resolveImageUrl(qimg) : '',
      options: 'ABCD'.split('').map(l => (q.opts[l] || '').trim()), correct,
      explainText, explainImageUrl: eimg && urlOk(eimg) ? resolveImageUrl(eimg) : ''
    });
  });
  return { questions, errors };
}

function drawTextGenerator(body, onPublished){
  body.appendChild(el(`
    <div class="card">
      <div class="card-title">📝 Create test from text</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;line-height:1.6">
        Paste plain text — no HTML needed. Each question: <b style="color:var(--text)">Q1.</b> text, options <b style="color:var(--text)">A.</b> to <b style="color:var(--text)">D.</b>, then <b style="color:var(--text)">Answer:</b> and optional <b style="color:var(--text)">Explanation:</b>, <b style="color:var(--text)">Question Image:</b>, <b style="color:var(--text)">Explanation Image:</b>. Up to ${TEST_MAX_QUESTIONS} questions.
      </div>
      <div class="field"><label>Title</label><input id="tgTitle" placeholder="Full Test - 01"></div>
      <div class="row2">
        <div class="field"><label>Subject</label><input id="tgSubject" placeholder="Chemistry"></div>
        <div class="field"><label>Batch</label><select id="tgBatch"><option value="">Select batch...</option></select></div>
      </div>
      <div class="row2">
        <div class="field"><label>Type</label><select id="tgType"><option value="live">🔴 Live</option><option value="selfpaced" selected>⏱ Regular</option><option value="practice">📚 Practice (no timer)</option></select></div>
        <div class="field"><label>Duration (mins, 0 = no timer)</label><input type="number" id="tgDuration" value="30" min="0"></div>
      </div>
      <div class="row2" id="tgLiveBox" style="display:none">
        <div class="field"><label>Live starts (date &amp; time)</label><input type="datetime-local" id="tgLiveStart"></div>
        <div class="field"><label>Live ends (date &amp; time)</label><input type="datetime-local" id="tgLiveEnd"></div>
      </div>
      <div class="row2">
        <div class="field"><label>Marks per question</label><input type="number" id="tgCorrect" value="4" min="0" step="0.25"></div>
        <div class="field"><label>Negative marks per wrong answer</label><input type="number" id="tgNeg" value="1" min="0" step="0.25"></div>
      </div>
      <div class="field"><label>Answer button layout</label>
        <select id="tgLayout"><option value="grid2x2" selected>2 × 2 grid</option><option value="horizontal">Horizontal (A B C D in a row)</option><option value="vertical">Vertical (stacked)</option></select>
      </div>
      <div class="field"><label>Test text</label><textarea id="tgText" style="min-height:220px;font-size:13px" placeholder="Q1. Which element has atomic number 17?&#10;A. Sodium&#10;B. Chlorine&#10;C. Potassium&#10;D. Calcium&#10;Answer: B&#10;Explanation: Chlorine has atomic number 17."></textarea></div>
      <div id="tgResult" style="font-size:12px;line-height:1.6;margin-bottom:10px"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost" id="tgCheck">Check text</button>
        <button class="btn btn-ghost" id="tgPreview">👁 Preview</button>
        <button class="btn btn-primary" id="tgPublish">🚀 Generate &amp; publish test</button>
      </div>
    </div>`));
  loadActiveBatchesInto($('#tgBatch', body));
  $('#tgType',body).addEventListener('change', ()=>{ $('#tgLiveBox',body).style.display = $('#tgType',body).value==='live' ? '' : 'none'; });
  const correctMark = () => parseFloat($('#tgCorrect',body).value) || 0;
  function check(){
    const r = parseTestText($('#tgText',body).value), box = $('#tgResult',body);
    if(r.errors.length){
      box.innerHTML = '<div style="color:var(--danger,#ef4444)"><b>Fix these before publishing (' + r.errors.length + '):</b><br>' + r.errors.slice(0,40).map(esc).join('<br>') + (r.errors.length>40 ? '<br>…and ' + (r.errors.length-40) + ' more.' : '') + '</div>';
      return null;
    }
    box.innerHTML = '<div style="color:var(--success,#22c55e)">✓ ' + r.questions.length + ' questions ready · full marks ' + (Math.round(r.questions.length*correctMark()*100)/100) + '</div>';
    return r;
  }
  $('#tgCheck',body).addEventListener('click', check);
  $('#tgPreview',body).addEventListener('click', ()=>{
    const r = check(); if(!r) return;       // shows the existing parse errors inline if the text isn't ready
    openTestPreview({
      title: $('#tgTitle',body).value.trim(), subject: $('#tgSubject',body).value.trim(), questions: r.questions,
      meta: { correctMark: correctMark(), wrongMark: -Math.abs(parseFloat($('#tgNeg',body).value) || 0),
              duration: Math.max(0, parseInt($('#tgDuration',body).value) || 0), answerButtonLayout: $('#tgLayout',body).value }
    });
  });
  $('#tgPublish',body).addEventListener('click', async ()=>{
    const r = check(); if(!r) return;       // parse errors are shown inline, as before
    const title = $('#tgTitle',body).value.trim();
    const batchSel = $('#tgBatch',body), batchId = batchSel.value;
    const subject = $('#tgSubject',body).value.trim();
    const type = $('#tgType',body).value;
    const v = validateTestDraft({ title, subject, batchId, type, questions: r.questions,
      correctMarkRaw: $('#tgCorrect',body).value, wrongMarkRaw: $('#tgNeg',body).value, durationRaw: $('#tgDuration',body).value,
      liveStartRaw: $('#tgLiveStart',body).value, liveEndRaw: $('#tgLiveEnd',body).value });
    if(!await confirmDraftIssues(v, 'Publish anyway')) return;
    const marks = correctMark(), neg = Math.abs(parseFloat($('#tgNeg',body).value) || 0);
    const live = readLiveSchedule(type, $('#tgLiveStart',body).value, $('#tgLiveEnd',body).value);
    if(live.error){ toast(live.error); return; }
    const batchName = batchId === GENERAL_BATCH_ID ? 'Free Demo' : batchSel.selectedOptions[0].textContent;
    const meta = { title, subject, correctMark: marks, wrongMark: -neg, duration: Math.max(0, parseInt($('#tgDuration',body).value) || 0), answerButtonLayout: $('#tgLayout',body).value };
    if(!await publishNormalizedTest({ title, subject, batchId, batchName, type, meta, questions: r.questions, live, source:'text' })) return;
    $('#tgTitle',body).value=''; $('#tgText',body).value=''; $('#tgResult',body).innerHTML=''; batchSel.value='';
    if(onPublished) onPublished();
  });
}


function renderAdminNotes(container){
  let sub = 'published', teardown = null; // published | add
  const tabs = el(`<div class="tab-filter"><button data-s="published">📋 Published Notes</button><button data-s="add">➕ Add Note</button></div>`);
  container.appendChild(tabs);
  const body = el(`<div></div>`);
  container.appendChild(body);
  function draw(){
    if(teardown){ teardown(); teardown = null; }
    $all('button',tabs).forEach(x=> x.classList.toggle('active', x.dataset.s===sub));
    body.innerHTML = '';
    if(sub==='published') teardown = renderPublishedContentSection(body, NOTE_CFG);
    else drawNoteForm(body);
  }
  tabs.addEventListener('click', e=>{ const b=e.target.closest('button'); if(!b) return; sub=b.dataset.s; draw(); });
  draw();
}

function drawNoteForm(container){
  container.appendChild(el(`<div>
    <div class="card">
      <div class="card-title">➕ Add note / assignment (Google Drive)</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;line-height:1.6">
        Upload the PDF to Google Drive → right-click → <b style="color:var(--text)">Share</b> → set to
        <b style="color:var(--text)">"Anyone with the link → Viewer"</b> → copy the link and paste it below.
        For a truly view-only file, also open the share dialog's ⚙️ settings and turn <b style="color:var(--text)">off</b>
        "Viewers can download, print and copy" — that disables downloading at the Drive level, not just in this app.
      </div>
      <div class="field"><label>Title</label><input id="nTitle" placeholder="Chapter 5 — Electric Current Notes"></div>
      <div class="row2">
        <div class="field"><label>Subject</label><input id="nSubject" placeholder="Physics"></div>
        <div class="field"><label>Batch</label><select id="nBatch"><option value="">Select batch...</option></select></div>
      </div>
      <div class="field"><label>Type</label><select id="nType"><option value="study">Study material</option><option value="assignment">Assignment</option></select></div>
      <div class="field"><label>Allow download?</label><select id="nDownload"><option value="yes">Yes — downloadable</option><option value="no">No — view only</option></select></div>
      <div class="field"><label>Google Drive share link</label><input id="nDriveLink" placeholder="https://drive.google.com/file/d/xxxxxxxx/view"></div>
      <button class="btn btn-primary" id="uploadNote">💾 Save to Firebase</button>
    </div>
  </div>`));
  loadActiveBatchesInto($('#nBatch', container));
  $('#uploadNote', container).addEventListener('click', async ()=>{
    const title = $('#nTitle',container).value.trim();
    const link = $('#nDriveLink',container).value.trim();
    const batchSel = $('#nBatch',container);
    const batchId = batchSel.value;
    if(!title || !link){ toast('Fill title and paste a Drive link'); return; }
    if(!batchId){ toast('Select a batch'); return; }
    const batchName = batchId === GENERAL_BATCH_ID ? 'Free Demo' : batchSel.selectedOptions[0].textContent;
    const driveId = driveIdFromUrl(link);
    if(!driveId){ toast('Could not read a file ID from that link'); return; }
    const btn = $('#uploadNote',container); btn.disabled = true; btn.textContent = 'Saving…';
    try{
      await db.collection(COL.notes).add({
        title, subject: $('#nSubject',container).value.trim(), batchId, batchName,
        fileType: $('#nType',container).value,
        downloadable: $('#nDownload',container).value === 'yes',
        driveId, driveLink: link,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      toast('✅ Saved to Firebase!');
      $('#nTitle',container).value=''; $('#nDriveLink',container).value=''; batchSel.value='';
    }catch(e){
      console.error(e);
      toast('Could not save — check your connection.');
    }
    btn.disabled = false; btn.textContent = '💾 Save to Firebase';
  });
}

/* ================================================================
   ADMIN — Announcements (Phase E)
   ----------------------------------------------------------------
   One form doubles as create and edit (this app has no existing
   edit-in-place pattern to follow, so this is the minimal version: the
   same fields, an editingId closure var, and the Save button switches
   between adding a new doc and updating the existing one so editing
   never creates a duplicate). Audience uses the same batch dropdown
   helper as every other content form, including the Free Demo/general
   option added in Phase D.5.
   ================================================================ */
function renderAdminAnnouncements(container){
  container.appendChild(el(`<div>
    <div class="card">
      <div class="card-title" id="annFormTitle">📢 New announcement</div>
      <div class="field"><label>Title</label><input id="annTitle" placeholder="Class Cancelled"></div>
      <div class="field"><label>Message</label><textarea id="annMessage" style="min-height:90px" placeholder="Today's chemistry class has been postponed to tomorrow at 7 PM."></textarea></div>
      <div class="field"><label>Audience</label><select id="annBatch"><option value="">Select audience...</option></select></div>
      <div class="row2">
        <button class="btn btn-primary" id="saveAnnouncement">📢 Post announcement</button>
        <button class="btn btn-ghost" id="cancelEditAnn" style="display:none">Cancel edit</button>
      </div>
    </div>
    <div class="card-title" style="margin:14px 0 8px">All announcements</div>
    <div id="announcementsAdminList"><div class="spinner"></div></div>
  </div>`));
  loadActiveBatchesInto($('#annBatch', container));

  let editingId = null;
  function resetAnnForm(){
    editingId = null;
    $('#annFormTitle', container).textContent = '📢 New announcement';
    $('#annTitle', container).value = '';
    $('#annMessage', container).value = '';
    $('#annBatch', container).value = '';
    $('#saveAnnouncement', container).textContent = '📢 Post announcement';
    $('#cancelEditAnn', container).style.display = 'none';
  }
  $('#cancelEditAnn', container).addEventListener('click', resetAnnForm);

  $('#saveAnnouncement', container).addEventListener('click', async ()=>{
    const title = $('#annTitle',container).value.trim();
    const message = $('#annMessage',container).value.trim();
    const batchSel = $('#annBatch',container);
    const batchId = batchSel.value;
    if(!title || !message){ toast('Fill in title and message'); return; }
    if(!batchId){ toast('Select an audience'); return; }
    const batchName = batchId === GENERAL_BATCH_ID ? 'Free Demo' : batchSel.selectedOptions[0].textContent;
    const btn = $('#saveAnnouncement',container); btn.disabled = true;
    try{
      if(editingId){
        await db.collection(COL.announcements).doc(editingId).update({
          title, message, batchId, batchName,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        toast('Announcement updated');
      } else {
        await db.collection(COL.announcements).add({
          title, message, batchId, batchName, active: true,
          createdBy: CURRENT_USER.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        toast('Announcement posted');
      }
      resetAnnForm();
    }catch(e){
      console.error(e);
      toast('Could not save — check your connection.');
    }
    btn.disabled = false;
  });

  const listBox = $('#announcementsAdminList', container);
  const unsub = db.collection(COL.announcements).orderBy('createdAt','desc').onSnapshot(snap=>{
    const items=[]; snap.forEach(d=>items.push({id:d.id,...d.data()}));
    listBox.innerHTML='';
    if(!items.length){ listBox.innerHTML='<div class="empty-state">No announcements yet.</div>'; return; }
    items.forEach(a=>{
      const card = el(`<div class="item-card">
        <div class="item-top"><div class="item-icon">📢</div><div class="item-info">
          <div class="item-title">${esc(a.title)}</div>
          <div class="item-meta" style="white-space:pre-wrap">${esc(a.message)}</div>
          <div class="item-badges">
            <span class="badge badge-muted">${esc(a.batchName||'')}</span>
            <span class="badge ${a.active===false?'badge-muted':'badge-free'}">${a.active===false?'Inactive':'Active'}</span>
            <span class="badge badge-muted">${fmtDate(a.createdAt)}</span>
          </div>
        </div></div>
        <div class="item-actions">
          <button class="btn-sm btn-ghost" data-act="edit">${icon('edit',15)}<span>Edit</span></button>
          <button class="btn-sm btn-ghost" data-act="toggle">${icon(a.active===false?'check':'ban',15)}<span>${a.active===false?'Activate':'Deactivate'}</span></button>
          <button class="btn-sm btn-danger" data-act="del">${icon('trash',15)}<span>Delete</span></button>
        </div>
      </div>`);
      $all('button', card).forEach(b=> b.addEventListener('click', async ()=>{
        if(b.dataset.act==='edit'){
          editingId = a.id;
          $('#annFormTitle', container).textContent = '✏️ Edit announcement';
          $('#annTitle', container).value = a.title||'';
          $('#annMessage', container).value = a.message||'';
          $('#annBatch', container).value = a.batchId||'';
          $('#saveAnnouncement', container).textContent = '💾 Update announcement';
          $('#cancelEditAnn', container).style.display = '';
        } else if(b.dataset.act==='toggle'){
          try{
            await db.collection(COL.announcements).doc(a.id).update({ active: a.active===false, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            toast(a.active===false ? 'Activated' : 'Deactivated');
          }catch(err){ console.error(err); toast('Action failed — check your connection.'); }
        } else if(b.dataset.act==='del'){
          if(!await adminConfirmSheet({ title:'Delete this announcement?', lines:['Students will no longer see it. This does not affect students, enrollments, batches, content, results or payments.'], cancel:'Cancel', confirm:'Delete' })) return;
          try{
            await db.collection(COL.announcements).doc(a.id).delete();
            toast('Deleted');
            if(editingId===a.id) resetAnnForm();
          }catch(err){ console.error(err); toast('Delete failed — check your connection.'); }
        }
      }));
      listBox.appendChild(card);
    });
  }, err=> console.error(err));
  trackUnsub(unsub);
}

/* Admin CRUD for the dashboard promotional banner carousel. Deliberately
   modeled on renderAdminAnnouncements() above for consistency, but
   simpler — banners are general/everyone only (no audience/batch field
   at all) and carry no active-student notification behavior. */
function renderAdminBanners(container){
  container.appendChild(el(`<div>
    <div class="card">
      <div class="card-title" id="bnrFormTitle">🖼️ New banner</div>
      <div class="field"><label>Label (admin only — not shown to students)</label><input id="bnrTitle" placeholder="Diwali Greeting"></div>
      <div class="field"><label>Image URL</label><input id="bnrImageUrl" placeholder="https://..."></div>
      <div class="field"><label>Order (lower shows first — optional)</label><input id="bnrOrder" type="number" placeholder="0"></div>
      <div class="row2">
        <button class="btn btn-primary" id="saveBanner">🖼️ Add banner</button>
        <button class="btn btn-ghost" id="cancelEditBnr" style="display:none">Cancel edit</button>
      </div>
    </div>
    <div class="card-title" style="margin:14px 0 8px">All banners</div>
    <div id="bannersAdminList"><div class="spinner"></div></div>
  </div>`));

  let editingId = null;
  function resetBnrForm(){
    editingId = null;
    $('#bnrFormTitle', container).textContent = '🖼️ New banner';
    $('#bnrTitle', container).value = '';
    $('#bnrImageUrl', container).value = '';
    $('#bnrOrder', container).value = '';
    $('#saveBanner', container).textContent = '🖼️ Add banner';
    $('#cancelEditBnr', container).style.display = 'none';
  }
  $('#cancelEditBnr', container).addEventListener('click', resetBnrForm);

  $('#saveBanner', container).addEventListener('click', async ()=>{
    const title = $('#bnrTitle',container).value.trim();
    const imageUrl = $('#bnrImageUrl',container).value.trim();
    const orderRaw = $('#bnrOrder',container).value.trim();
    const order = orderRaw === '' ? 0 : Number(orderRaw);
    if(!title){ toast('Enter a label'); return; }
    if(!imageUrl || !/^https?:\/\//i.test(imageUrl)){ toast('Enter a valid image URL (starting with http:// or https://)'); return; }
    if(Number.isNaN(order)){ toast('Order must be a number'); return; }
    const btn = $('#saveBanner',container); btn.disabled = true;
    try{
      if(editingId){
        await db.collection(COL.banners).doc(editingId).update({
          title, imageUrl, order, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        toast('Banner updated');
      } else {
        await db.collection(COL.banners).add({
          title, imageUrl, order, active: true,
          createdBy: CURRENT_USER.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        toast('Banner added');
      }
      resetBnrForm();
    }catch(e){
      console.error(e);
      toast('Could not save — check your connection.');
    }
    btn.disabled = false;
  });

  const listBox = $('#bannersAdminList', container);
  const unsub = db.collection(COL.banners).orderBy('createdAt','desc').onSnapshot(snap=>{
    const items=[]; snap.forEach(d=>items.push({id:d.id,...d.data()}));
    listBox.innerHTML='';
    if(!items.length){ listBox.innerHTML='<div class="empty-state">No banners yet.</div>'; return; }
    items.forEach(b=>{
      const card = el(`<div class="item-card">
        <img src="${esc(resolveImageUrl(b.imageUrl))}" alt="" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px;display:block;margin-bottom:8px;background:var(--surface-2)">
        <div class="item-top"><div class="item-info">
          <div class="item-title">${esc(b.title||'Banner')}</div>
          <div class="item-meta">Order: ${esc(String(b.order ?? 0))}</div>
          <div class="item-badges">
            <span class="badge ${b.active===false?'badge-muted':'badge-free'}">${b.active===false?'Inactive':'Active'}</span>
            <span class="badge badge-muted">${fmtDate(b.createdAt)}</span>
          </div>
        </div></div>
        <div class="item-actions">
          <button class="btn-sm btn-ghost" data-act="edit">${icon('edit',15)}<span>Edit</span></button>
          <button class="btn-sm btn-ghost" data-act="toggle">${icon(b.active===false?'check':'ban',15)}<span>${b.active===false?'Activate':'Deactivate'}</span></button>
          <button class="btn-sm btn-danger" data-act="del">${icon('trash',15)}<span>Delete</span></button>
        </div>
      </div>`);
      $all('button', card).forEach(btn2=> btn2.addEventListener('click', async ()=>{
        if(btn2.dataset.act==='edit'){
          editingId = b.id;
          $('#bnrFormTitle', container).textContent = '✏️ Edit banner';
          $('#bnrTitle', container).value = b.title||'';
          $('#bnrImageUrl', container).value = b.imageUrl||'';
          $('#bnrOrder', container).value = String(b.order ?? 0);
          $('#saveBanner', container).textContent = '💾 Update banner';
          $('#cancelEditBnr', container).style.display = '';
        } else if(btn2.dataset.act==='toggle'){
          try{
            await db.collection(COL.banners).doc(b.id).update({ active: b.active===false, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            toast(b.active===false ? 'Activated' : 'Deactivated');
          }catch(err){ console.error(err); toast('Action failed — check your connection.'); }
        } else if(btn2.dataset.act==='del'){
          if(!await adminConfirmSheet({ title:'Delete this banner?', lines:['It will no longer show on the student dashboard. This does not affect students, enrollments, batches, content, results, payments, or announcements.'], cancel:'Cancel', confirm:'Delete' })) return;
          try{
            await db.collection(COL.banners).doc(b.id).delete();
            toast('Deleted');
            if(editingId===b.id) resetBnrForm();
          }catch(err){ console.error(err); toast('Delete failed — check your connection.'); }
        }
      }));
      listBox.appendChild(card);
    });
  }, err=> console.error(err));
  trackUnsub(unsub);
}

/* ================================================================
   ADMIN — Calendar / Class Schedule (Phase F)
   ----------------------------------------------------------------
   Same create-doubles-as-edit form pattern as Announcements. Rescheduling
   isn't a separate flow: editing an existing entry's date/start/end time
   is what rescheduling IS — the save handler detects the change itself
   and stamps rescheduled:true + the ORIGINAL date/time (captured once,
   never overwritten by a later reschedule, so it always points at the
   true original even after several moves). Cancelling just flips status
   — the entry is never deleted by it, matching "cancelled classes stay
   visible, clearly marked" rather than disappearing. A plain list view
   here rather than a second calendar grid: the grid is a student-facing
   requirement (section 6), and a sorted list is consistent with every
   other admin content section already in this app. */
function renderAdminCalendar(container){
  container.appendChild(el(`<div>
    <div class="card">
      <div class="card-title" id="schFormTitle">📅 New class</div>
      <div class="field">
        <label>Schedule type</label>
        <div class="tab-filter" id="schTypeToggle">
          <button data-type="onetime" class="active">One-time</button>
          <button data-type="recurring">Recurring weekly</button>
        </div>
      </div>
      <div class="field"><label>Audience / Batch</label><select id="schBatch"><option value="">Select audience...</option></select></div>

      <div id="schOnetimeFields">
        <div class="row2">
          <div class="field"><label>Date</label><input type="date" id="schDate"></div>
          <div class="field"><label>Class type (optional)</label><input id="schType" placeholder="Regular"></div>
        </div>
      </div>

      <div id="schRecurringFields" style="display:none">
        <div class="row2">
          <div class="field"><label>Start date</label><input type="date" id="schRuleStart"></div>
          <div class="field"><label>End date</label><input type="date" id="schRuleEnd"></div>
        </div>
        <div class="field"><label>Class type (optional)</label><input id="schRuleType" placeholder="Regular"></div>
        <div class="field">
          <label>Repeat on</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i)=>`
              <label style="display:flex;align-items:center;gap:5px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:12px;color:var(--text-muted)">
                <input type="checkbox" class="schDow" value="${i}" style="width:auto"> ${d}
              </label>`).join('')}
          </div>
        </div>
      </div>

      <div class="row2">
        <div class="field"><label>Start time</label><input type="time" id="schStart"></div>
        <div class="field"><label>End time</label><input type="time" id="schEnd"></div>
      </div>
      <div class="field"><label>Title</label><input id="schTitle" placeholder="Organic Chemistry"></div>
      <div class="row2">
        <div class="field"><label>Topic (optional)</label><input id="schTopic" placeholder="Alcohols"></div>
        <div class="field"><label>Teacher (optional)</label><input id="schTeacher" placeholder=""></div>
      </div>
      <div class="row2">
        <button class="btn btn-primary" id="saveSchedule">📅 Add to schedule</button>
        <button class="btn btn-ghost" id="cancelEditSch" style="display:none">Cancel edit</button>
      </div>
    </div>
    <div class="card-title" style="margin:14px 0 8px">All scheduled classes</div>
    <div id="scheduleAdminList"><div class="spinner"></div></div>
    <div class="card-title" style="margin:14px 0 8px">🔁 Recurring schedules</div>
    <div id="scheduleRuleList"><div class="spinner"></div></div>
  </div>`));
  loadActiveBatchesInto($('#schBatch', container));

  let editingId = null, editingEntry = null;       // one-time classSchedules doc being edited
  let editingRuleId = null;                         // classScheduleRules doc being edited
  let scheduleType = 'onetime';                     // 'onetime' | 'recurring' — which form is active

  function setScheduleType(type){
    scheduleType = type;
    $all('#schTypeToggle button', container).forEach(b=> b.classList.toggle('active', b.dataset.type===type));
    $('#schOnetimeFields', container).style.display = type==='onetime' ? '' : 'none';
    $('#schRecurringFields', container).style.display = type==='recurring' ? '' : 'none';
  }
  $('#schTypeToggle', container).addEventListener('click', e=>{
    const b = e.target.closest('button'); if(!b) return;
    resetSchForm(); // switching type mid-edit would mix up two different edit targets — safest to reset
    setScheduleType(b.dataset.type);
  });

  function resetSchForm(){
    editingId = null; editingEntry = null;
    editingRuleId = null;
    $('#schFormTitle', container).textContent = '📅 New class';
    ['schDate','schType','schStart','schEnd','schTitle','schTopic','schTeacher','schRuleStart','schRuleEnd','schRuleType']
      .forEach(id=> $('#'+id,container).value='');
    $all('.schDow', container).forEach(cb=> cb.checked = false);
    $('#schBatch', container).value = '';
    $('#saveSchedule', container).textContent = '📅 Add to schedule';
    $('#cancelEditSch', container).style.display = 'none';
    setScheduleType('onetime');
  }
  $('#cancelEditSch', container).addEventListener('click', resetSchForm);

  $('#saveSchedule', container).addEventListener('click', async ()=>{
    const btn = $('#saveSchedule',container);

    if(scheduleType === 'recurring'){
      const batchSel = $('#schBatch',container);
      const batchId = batchSel.value;
      const startDate = $('#schRuleStart',container).value;
      const endDate = $('#schRuleEnd',container).value;
      const startTime = $('#schStart',container).value;
      const endTime = $('#schEnd',container).value;
      const title = $('#schTitle',container).value.trim();
      const topic = $('#schTopic',container).value.trim();
      const classType = $('#schRuleType',container).value.trim();
      const teacher = $('#schTeacher',container).value.trim();
      const daysOfWeek = $all('.schDow', container).filter(cb=>cb.checked).map(cb=>Number(cb.value));
      if(!batchId){ toast('Select an audience'); return; }
      if(!startDate){ toast('Select a start date'); return; }
      if(!endDate){ toast('Select an end date'); return; }
      if(endDate < startDate){ toast('End date cannot be before start date'); return; }
      if(!daysOfWeek.length){ toast('Select at least one repeat day'); return; }
      if(!startTime || !endTime){ toast('Enter start and end time'); return; }
      if(endTime <= startTime){ toast('End time must be after start time'); return; }
      if(!title){ toast('Enter a title'); return; }
      const batchName = batchId === GENERAL_BATCH_ID ? 'Free Demo' : batchSel.selectedOptions[0].textContent;
      btn.disabled = true;
      try{
        if(editingRuleId){
          await db.collection(COL.classScheduleRules).doc(editingRuleId).update({
            batchId, batchName, startDate, endDate, startTime, endTime, title, topic, classType, teacher, daysOfWeek,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          toast('Recurring schedule updated');
        } else {
          await db.collection(COL.classScheduleRules).add({
            batchId, batchName, startDate, endDate, startTime, endTime, title, topic, classType, teacher, daysOfWeek,
            status: 'active', overrides: {},
            createdBy: CURRENT_USER.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          toast('Recurring schedule created');
        }
        resetSchForm();
      }catch(e){
        console.error(e);
        toast('Could not save — check your connection.');
      }
      btn.disabled = false;
      return;
    }

    // ---- one-time class (unchanged from the original working implementation) ----
    const date = $('#schDate',container).value;
    const startTime = $('#schStart',container).value;
    const endTime = $('#schEnd',container).value;
    const title = $('#schTitle',container).value.trim();
    const topic = $('#schTopic',container).value.trim();
    const classType = $('#schType',container).value.trim();
    const teacher = $('#schTeacher',container).value.trim();
    const batchSel = $('#schBatch',container);
    const batchId = batchSel.value;
    if(!batchId){ toast('Select an audience'); return; }
    if(!date){ toast('Select a date'); return; }
    if(!startTime || !endTime){ toast('Enter start and end time'); return; }
    if(endTime <= startTime){ toast('End time must be after start time'); return; }
    if(!title){ toast('Enter a title'); return; }
    const batchName = batchId === GENERAL_BATCH_ID ? 'Free Demo' : batchSel.selectedOptions[0].textContent;
    btn.disabled = true;
    try{
      if(editingId){
        const payload = { batchId, batchName, date, startTime, endTime, title, topic, classType, teacher, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
        const dateChanged = date !== editingEntry.date || startTime !== editingEntry.startTime || endTime !== editingEntry.endTime;
        if(dateChanged){
          payload.rescheduled = true;
          if(!editingEntry.rescheduled){
            // first time this entry has moved — capture the TRUE original,
            // never overwritten by any later reschedule.
            payload.originalDate = editingEntry.date;
            payload.originalStartTime = editingEntry.startTime;
            payload.originalEndTime = editingEntry.endTime;
          }
        }
        await db.collection(COL.classSchedules).doc(editingId).update(payload);
        toast('Class updated');
      } else {
        await db.collection(COL.classSchedules).add({
          batchId, batchName, date, startTime, endTime, title, topic, classType, teacher,
          status: 'scheduled', rescheduled: false,
          createdBy: CURRENT_USER.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        toast('Class added to schedule');
      }
      resetSchForm();
    }catch(e){
      console.error(e);
      toast('Could not save — check your connection.');
    }
    btn.disabled = false;
  });

  const listBox = $('#scheduleAdminList', container);
  const unsub = db.collection(COL.classSchedules).orderBy('date','desc').onSnapshot(snap=>{
    const items=[]; snap.forEach(d=>items.push({id:d.id,...d.data()}));
    listBox.innerHTML='';
    if(!items.length){ listBox.innerHTML='<div class="empty-state">No classes scheduled yet.</div>'; return; }
    items.forEach(c=>{
      const cancelled = c.status === 'cancelled';
      const card = el(`<div class="item-card">
        <div class="item-top"><div class="item-icon">${cancelled?'🚫':'📅'}</div><div class="item-info">
          <div class="item-title" style="${cancelled?'text-decoration:line-through;opacity:.6':''}">${esc(c.title||'Class')}</div>
          <div class="item-meta">${esc(c.date||'')} · ${esc(c.startTime||'')}–${esc(c.endTime||'')}${c.topic?(' · '+esc(c.topic)):''}</div>
          <div class="item-badges">
            <span class="badge badge-muted">${esc(c.batchName||'')}</span>
            ${cancelled?'<span class="badge badge-paid">Cancelled</span>':'<span class="badge badge-free">Scheduled</span>'}
            ${c.rescheduled?'<span class="badge badge-muted">Rescheduled</span>':''}
          </div>
        </div></div>
        <div class="item-actions">
          <button class="btn-sm btn-ghost" data-act="edit">${icon('edit',15)}<span>Edit</span></button>
          <button class="btn-sm btn-ghost" data-act="toggle">${icon(cancelled?'check':'ban',15)}<span>${cancelled?'Restore':'Cancel'}</span></button>
          <button class="btn-sm btn-danger" data-act="del">${icon('trash',15)}<span>Delete</span></button>
        </div>
      </div>`);
      $all('button', card).forEach(b=> b.addEventListener('click', async ()=>{
        if(b.dataset.act==='edit'){
          resetSchForm();
          editingId = c.id; editingEntry = c;
          setScheduleType('onetime');
          $('#schFormTitle', container).textContent = '✏️ Edit class';
          $('#schBatch', container).value = c.batchId||'';
          $('#schDate', container).value = c.date||'';
          $('#schStart', container).value = c.startTime||'';
          $('#schEnd', container).value = c.endTime||'';
          $('#schTitle', container).value = c.title||'';
          $('#schTopic', container).value = c.topic||'';
          $('#schType', container).value = c.classType||'';
          $('#schTeacher', container).value = c.teacher||'';
          $('#saveSchedule', container).textContent = '💾 Update class';
          $('#cancelEditSch', container).style.display = '';
        } else if(b.dataset.act==='toggle'){
          try{
            await db.collection(COL.classSchedules).doc(c.id).update({ status: cancelled?'scheduled':'cancelled', updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            toast(cancelled ? 'Restored' : 'Class cancelled');
          }catch(err){ console.error(err); toast('Action failed — check your connection.'); }
        } else if(b.dataset.act==='del'){
          if(!await adminConfirmSheet({ title:'Delete this class from the schedule?', lines:['Students will no longer see it. This does not affect students, enrollments, batches, content, results or payments.'], cancel:'Cancel', confirm:'Delete' })) return;
          try{
            await db.collection(COL.classSchedules).doc(c.id).delete();
            toast('Deleted');
            if(editingId===c.id) resetSchForm();
          }catch(err){ console.error(err); toast('Delete failed — check your connection.'); }
        }
      }));
      listBox.appendChild(card);
    });
  }, err=> console.error(err));
  trackUnsub(unsub);

  /* ================================================================
     Recurring rule list — series-level management (edit/pause/delete)
     plus a per-rule "manage a date" mini-form for the one-off
     cancel/reschedule exceptions the spec calls for. Kept as the
     smallest safe UI extension: it writes only to this ONE rule's own
     `overrides` map (dot-path field update / FieldValue.delete()),
     never touches classSchedules, and never generates new documents.
     ================================================================ */
  const ruleListBox = $('#scheduleRuleList', container);
  const unsubRules = db.collection(COL.classScheduleRules).orderBy('startDate','desc').onSnapshot(snap=>{
    const rules=[]; snap.forEach(d=>rules.push({id:d.id,...d.data()}));
    ruleListBox.innerHTML='';
    if(!rules.length){ ruleListBox.innerHTML='<div class="empty-state">No recurring schedules yet.</div>'; return; }
    rules.forEach(r=>{
      const paused = r.status === 'inactive';
      const overrides = r.overrides || {};
      const overrideDates = Object.keys(overrides).sort();
      const card = el(`<div class="item-card">
        <div class="item-top"><div class="item-icon">🔁</div><div class="item-info">
          <div class="item-title" style="${paused?'opacity:.6':''}">${esc(r.title||'Class')}</div>
          <div class="item-meta">${esc(daysOfWeekLabel(r.daysOfWeek))} · ${esc(r.startTime||'')}–${esc(r.endTime||'')}${r.topic?(' · '+esc(r.topic)):''}</div>
          <div class="item-meta">${esc(r.startDate||'')} → ${esc(r.endDate||'')}</div>
          <div class="item-badges">
            <span class="badge badge-muted">${esc(r.batchName||'')}</span>
            ${paused?'<span class="badge badge-paid">Paused</span>':'<span class="badge badge-free">Active</span>'}
          </div>
        </div></div>
        <div class="item-actions">
          <button class="btn-sm btn-ghost" data-act="edit">${icon('edit',15)}<span>Edit</span></button>
          <button class="btn-sm btn-ghost" data-act="toggle">${icon(paused?'play':'pause',15)}<span>${paused?'Activate':'Pause'}</span></button>
          <button class="btn-sm btn-ghost" data-act="manage">${icon('calendar',15)}<span>Manage a date</span></button>
          <button class="btn-sm btn-danger" data-act="del">${icon('trash',15)}<span>Delete</span></button>
        </div>
        <div class="rule-manage" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid var(--border-soft)">
          <div class="field"><label>Date to change</label><input type="date" class="mgDate"></div>
          <div class="row2">
            <button class="btn-sm btn-danger mgCancelDate">${icon('ban',15)}<span>Cancel this date</span></button>
            <button class="btn-sm btn-ghost mgShowReschedule">${icon('refresh',15)}<span>Reschedule this date</span></button>
          </div>
          <div class="mgRescheduleFields" style="display:none;margin-top:8px">
            <div class="row2">
              <div class="field"><label>New date</label><input type="date" class="mgNewDate"></div>
              <div class="field"><label>New start time</label><input type="time" class="mgNewStart"></div>
            </div>
            <div class="field"><label>New end time</label><input type="time" class="mgNewEnd"></div>
            <button class="btn btn-primary btn-sm mgSaveReschedule">${icon('check',15)}<span>Save reschedule</span></button>
          </div>
          <div class="mgExisting" style="margin-top:10px">
            ${overrideDates.length ? '<div class="field"><label>Existing exceptions</label></div>' : ''}
            ${overrideDates.map(d=>{
              const ov = overrides[d];
              const desc = ov.status==='cancelled'
                ? `${esc(d)} — Cancelled`
                : `${esc(d)} → ${esc(ov.newDate||'')} ${esc(ov.startTime||'')}–${esc(ov.endTime||'')} (Rescheduled)`;
              return `<div class="item-meta" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px">
                <span>${desc}</span>
                <button class="btn-sm btn-ghost mgRemoveOverride" data-date="${esc(d)}">Remove</button>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>`);

      $('[data-act="manage"]', card).addEventListener('click', ()=>{
        const box = $('.rule-manage', card);
        box.style.display = box.style.display==='none' ? '' : 'none';
      });
      $('.mgShowReschedule', card).addEventListener('click', ()=>{
        const box = $('.mgRescheduleFields', card);
        box.style.display = box.style.display==='none' ? '' : 'none';
      });
      $('.mgCancelDate', card).addEventListener('click', async ()=>{
        const date = $('.mgDate', card).value;
        if(!date){ toast('Pick a date first'); return; }
        try{
          await db.collection(COL.classScheduleRules).doc(r.id).update({
            [`overrides.${date}`]: { status: 'cancelled' },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          toast('That date is cancelled');
        }catch(err){ console.error(err); toast('Action failed — check your connection.'); }
      });
      $('.mgSaveReschedule', card).addEventListener('click', async ()=>{
        const date = $('.mgDate', card).value;
        const newDate = $('.mgNewDate', card).value;
        const newStart = $('.mgNewStart', card).value;
        const newEnd = $('.mgNewEnd', card).value;
        if(!date){ toast('Pick the original date first'); return; }
        if(!newDate){ toast('Pick the new date'); return; }
        if(!newStart || !newEnd){ toast('Enter the new start and end time'); return; }
        if(newEnd <= newStart){ toast('New end time must be after new start time'); return; }
        try{
          await db.collection(COL.classScheduleRules).doc(r.id).update({
            [`overrides.${date}`]: { status: 'rescheduled', newDate, startTime: newStart, endTime: newEnd },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          toast('That date is rescheduled');
        }catch(err){ console.error(err); toast('Action failed — check your connection.'); }
      });
      $all('.mgRemoveOverride', card).forEach(b=> b.addEventListener('click', async ()=>{
        try{
          await db.collection(COL.classScheduleRules).doc(r.id).update({
            [`overrides.${b.dataset.date}`]: firebase.firestore.FieldValue.delete(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          toast('Exception removed');
        }catch(err){ console.error(err); toast('Action failed — check your connection.'); }
      }));

      $('[data-act="edit"]', card).addEventListener('click', ()=>{
        resetSchForm();
        editingRuleId = r.id;
        setScheduleType('recurring');
        $('#schFormTitle', container).textContent = '✏️ Edit recurring schedule';
        $('#schBatch', container).value = r.batchId||'';
        $('#schRuleStart', container).value = r.startDate||'';
        $('#schRuleEnd', container).value = r.endDate||'';
        $('#schStart', container).value = r.startTime||'';
        $('#schEnd', container).value = r.endTime||'';
        $('#schTitle', container).value = r.title||'';
        $('#schTopic', container).value = r.topic||'';
        $('#schRuleType', container).value = r.classType||'';
        $('#schTeacher', container).value = r.teacher||'';
        $all('.schDow', container).forEach(cb=> cb.checked = (r.daysOfWeek||[]).includes(Number(cb.value)));
        $('#saveSchedule', container).textContent = '💾 Update recurring schedule';
        $('#cancelEditSch', container).style.display = '';
      });
      $('[data-act="toggle"]', card).addEventListener('click', async ()=>{
        try{
          await db.collection(COL.classScheduleRules).doc(r.id).update({ status: paused?'active':'inactive', updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
          toast(paused ? 'Recurring schedule activated' : 'Recurring schedule paused');
        }catch(err){ console.error(err); toast('Action failed — check your connection.'); }
      });
      $('[data-act="del"]', card).addEventListener('click', async ()=>{
        if(!await adminConfirmSheet({ title:'Delete this recurring schedule?', lines:['Students will no longer see any of its future classes. Past occurrences already shown to students are unaffected — this does not touch one-time classes, students, enrollments, batches, content, results or payments.'], cancel:'Cancel', confirm:'Delete' })) return;
        try{
          await db.collection(COL.classScheduleRules).doc(r.id).delete();
          toast('Deleted');
          if(editingRuleId===r.id) resetSchForm();
        }catch(err){ console.error(err); toast('Delete failed — check your connection.'); }
      });

      ruleListBox.appendChild(card);
    });
  }, err=> console.error(err));
  trackUnsub(unsubRules);
}

