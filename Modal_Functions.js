// ═══════════════════════════════════════════════════════════════
//  MODAL
// ═══════════════════════════════════════════════════════════════
function showQty(planNo, channel) {
  activePlanNo = planNo;
  document.getElementById("modalPlanBadge").textContent    = planNo;
  renderQtyRows(planTodStore[planNo] || []);
  document.getElementById("qtyModal").classList.add("open");
}

function weekOpts(selected) {
  let out = "";
  for (let yr = 2025; yr <= 2027; yr++)
    for (let w = 1; w <= 52; w++) {
      const v = "w" + w + " " + yr;
      out += `<option${v===selected?" selected":""}>${v}</option>`;
    }
  return out;
}

function renderQtyRows(data) {
  const tbody = document.getElementById("qtyTableBody");
  tbody.innerHTML = "";
  data.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="color:var(--text-muted);font-size:11.5px;font-weight:600;">${idx+1}</td>
      <td><select onchange="recalcModal()" class="tod-week" >${weekOpts(item.week)}</select></td>
      <td><input type="date" value="${item.date||""}" onchange="updateTODWeek(this)" ></td>
      <td><input type="number" value="${item.qtyPcs||0}" min="0" oninput="recalcModal()"></td>
      <td><button class="btn-del" onclick="deleteTODRow(this)" title="Remove">✕</button>
    `;
    tbody.appendChild(tr);
  });
  recalcModal();
}

function updateTODWeek(input) {
    const select = input.closest("tr").querySelector(".tod-week");
    const val = getISOWeek(input.value);

    [...select.options].forEach(opt => {
    if (opt.value === val || opt.text === val) {
        opt.selected = true;
    }
    });
}

function recalcModal() {
  let tp = 0, tk = 0;
  document.querySelectorAll("#qtyTableBody tr").forEach(r => {
    const ins = r.querySelectorAll("input[type='number']");
    tp += parseInt(ins[0]?.value)||0;
  });
  document.getElementById("qtyModalTotalPcs").textContent   = tp.toLocaleString();
}

function addTodRow() {
  const tbody = document.getElementById("qtyTableBody");
  const idx   = tbody.rows.length + 1;
  const tr    = document.createElement("tr");
  tr.innerHTML = `
    <td style="color:var(--text-muted);font-size:11.5px;font-weight:600;">${idx}</td>
    <td><select class="tod-week" onchange="recalcModal()">${weekOpts("")}</select></td>
    <td><input type="date" onchange="updateTODWeek(this)"></td>
    <td><input type="number" value="0" min="0" oninput="recalcModal()"></td>
    <td><button class="btn-del" onclick="deleteTODRow(this)" title="Remove">✕</button>
  `;
  tbody.appendChild(tr);
  recalcModal();
}

function deleteTODRow(btn) {
  btn.closest("tr").remove();
  recalcModal();
}

function shiftWeeksPlus1() {
  document.querySelectorAll("#qtyTableBody tr").forEach(r => {
    const sel = r.querySelector("select");
    const dinput = r.querySelector('input[type="date"]');
    if (!sel || !dinput) return;
    const shifted = shiftWeekStr(sel.value, 1);
    for (const opt of sel.options) { if (opt.value === shifted) { opt.selected = true; break; } }
    sel.value = shifted;
    const date = new Date(dinput.value);
    date.setDate(date.getDate() + 7);
    dinput.value = date.toISOString().split('T')[0];
  });
  showToast("⏩ All TOD weeks shifted +1", "success");
}

function shiftWeeksMinus1() {
  document.querySelectorAll("#qtyTableBody tr").forEach(r => {
    const sel = r.querySelector("select");
    const dinput = r.querySelector('input[type="date"]');
    if (!sel || !dinput) return;
    const shifted = shiftWeekStr(sel.value, -1);
    for (const opt of sel.options) { if (opt.value === shifted) { opt.selected = true; break; } }
    sel.value = shifted;
    const date = new Date(dinput.value);
    date.setDate(date.getDate() - 7);
    dinput.value = date.toISOString().split('T')[0];
  });
  showToast("⏩ All TOD weeks shifted +1", "success");
}

function saveModalQty() {
  const rows    = document.querySelectorAll("#qtyTableBody tr");
  const updated = Array.from(rows).map(r => {
    const sel  = r.querySelector("select");
    const ins  = r.querySelectorAll("input[type='number']");
    const dIn  = r.querySelector("input[type='date']");
    return { week:sel?.value||"", date:dIn?.value||"",
             qtyPcs:parseInt(ins[0]?.value)||0 };
  });
  planTodStore[activePlanNo] = updated;

  const planRow = document.querySelector(`tr[data-plan-no="${activePlanNo}"]`);
  if (planRow) {
    const tp = updated.reduce((s,t)=>s+t.qtyPcs,0);
    planRow.querySelector(".tod-count").textContent = updated.length;

    const minWeekRow = updated.reduce((a, b) => {
        const getWeek = (w) => 
            parseInt(w.week.split(" ")[0].replace("w", ""));
        return getWeek(b) < getWeek(a) ? b : a;
    });
    const minWeek = minWeekRow.week.split(" ")[0];

    const maxWeekRow = updated.reduce((a, b) => {
        const getWeek = (w) => 
            parseInt(w.week.split(" ")[0].replace("w", ""));
        return getWeek(b) > getWeek(a) ? b : a;
    });

    const maxWeek = maxWeekRow.week;

    planRow.querySelector(".tod-range").textContent = minWeek + ' - ' + maxWeek;
    
    const btn = planRow.querySelector(".btn-qty");
    if (btn) btn.innerHTML = `${tp.toLocaleString()}`;
    const npc = planRow.querySelector(".no-pieces-cell");
    if (npc) npc.innerHTML = buildNoPiecesSelect(calcNoPieces(updated));
  }
  updateStats();
  closeModal();
  showToast("✅ TOD quantities updated for " + activePlanNo, "success");
}

function closeModal() { document.getElementById("qtyModal").classList.remove("open"); }
document.getElementById("qtyModal").addEventListener("click", e => { if (e.target===document.getElementById("qtyModal")) closeModal(); });

