(() => {
  const K = {
    dados: "orc_dados",
    logo: "orc_logo",
    produtos: "orc_produtos",
    orcamentos: "orc_orcamentos",
    backupDias: "orc_backup_dias",
    backupUltimo: "orc_backup_ultimo",
    senha: "orc_senha"
  };

  const $ = id => document.getElementById(id);
  const json = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const fmt = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = v => String(v || "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const dataBR = iso => iso ? new Date(iso).toLocaleString("pt-BR") : "";

  function style() {
    const s = document.createElement("style");
    s.textContent = `
      .hist-list,.prod-list{display:flex;flex-direction:column;gap:10px;margin-top:10px}.hist-card,.prod-row,.prod-picker,.backup-box{background:#FFF9FC;border:1px solid #F2EAF8;border-radius:16px;padding:12px}.hist-card{box-shadow:0 5px 14px rgba(0,0,0,.04)}.hist-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.hist-title{font-size:13px;font-weight:800;color:#7a3a6b}.hist-meta,.hist-text,.backup-small,.backup-box p,.backup-box li{font-size:11px;color:#7a6c9f;line-height:1.55}.hist-total{font-size:12px;font-weight:800;color:#8C7BFF;white-space:nowrap}.hist-text{white-space:pre-wrap;background:#fff;border-radius:12px;padding:10px;margin-top:8px;display:none}.hist-actions,.backup-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.hist-actions button,.backup-actions button,.prod-picker button{border:none;border-radius:999px;padding:9px 10px;font-size:11px;font-weight:700;cursor:pointer;background:#F0EDFF;color:#8C7BFF;font-family:'Poppins',sans-serif}.hist-actions .danger{background:#FFE4E4;color:#c73232}.hist-empty{font-size:12px;color:#a08fc7;text-align:center;background:#FFF9FC;border-radius:14px;padding:16px}.backup-box ul{padding-left:18px;margin:8px 0}.backup-actions input[type=file]{grid-column:1/-1;border-radius:14px;font-size:12px;background:#fff}.prod-picker{margin:8px 0 12px}.prod-picker-title{font-size:12px;font-weight:800;color:#7a3a6b;margin-bottom:8px}.prod-picker-grid{display:grid;grid-template-columns:1fr 76px;gap:8px;align-items:end}.prod-picker button{grid-column:1/-1;padding:11px;font-size:12px}.prod-picker .hint{grid-column:1/-1;margin-top:2px}.prod-row{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:#7a6c9f}.prod-row strong{color:#7a3a6b}.prod-row button{width:28px;height:28px;border:none;border-radius:50%;background:#FFE4E4;color:#c73232;font-weight:800;cursor:pointer}
    `;
    document.head.appendChild(s);
  }

  function ensureHistoryTab() {
    if ($("panelHistorico")) return;
    const tabs = document.querySelector(".tabs");
    const main = document.querySelector("main");
    if (!tabs || !main) return;
    const tab = document.createElement("div");
    tab.className = "tab";
    tab.dataset.tab = "historico";
    tab.textContent = "Histórico";
    tabs.insertBefore(tab, tabs.querySelector('[data-tab="dados"]'));
    const panel = document.createElement("div");
    panel.id = "panelHistorico";
    panel.className = "panel";
    panel.innerHTML = `<div class="fcard"><div class="sec-title">Catálogo de orçamentos</div><div class="fgroup"><label class="lbl">Buscar por cliente, tema ou item</label><input type="text" id="histBusca" placeholder="Digite para buscar"></div><div class="hist-list" id="histList"></div></div>`;
    main.insertBefore(panel, $("panelDados"));
    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      panel.classList.add("active");
      renderHistory();
    };
    $("histBusca").oninput = renderHistory;
  }

  function ensureProductPicker() {
    if ($("prodPicker")) return;
    const list = $("iList");
    if (!list) return;
    const box = document.createElement("div");
    box.id = "prodPicker";
    box.className = "prod-picker";
    box.innerHTML = `<div class="prod-picker-title">Inserir produto cadastrado</div><div class="prod-picker-grid"><div><label class="mini-label">Produto salvo</label><select id="prodEscolhido"></select></div><div><label class="mini-label">Qtd.</label><input type="number" id="prodQtd" min="1" step="1" value="1"></div><button type="button" id="btnInserirProduto">Inserir no orçamento</button><p class="hint">Cadastre produtos em Meus dados. Depois escolha aqui para preencher o orçamento automaticamente.</p></div>`;
    list.parentElement.insertBefore(box, list);
    $("btnInserirProduto").onclick = insertProduct;
    renderProductSelect();
  }

  function renderProductSelect() {
    const select = $("prodEscolhido");
    if (!select) return;
    const produtos = json(K.produtos, []);
    select.innerHTML = produtos.length ? produtos.map((p, i) => `<option value="${i}">${esc(p.nome)} - ${fmt(p.valor)}</option>`).join("") : '<option value="">Nenhum produto cadastrado</option>';
  }

  function insertProduct() {
    const produtos = json(K.produtos, []);
    const p = produtos[Number($("prodEscolhido")?.value)];
    if (!p) { alert("Cadastre um produto em Meus dados primeiro."); return; }
    const qtd = Math.max(1, parseInt($("prodQtd")?.value || "1"));
    $("btnAddItem")?.click();
    const rows = document.querySelectorAll("#iList .irow");
    const row = rows[rows.length - 1];
    const inputs = row?.querySelectorAll("input");
    if (inputs?.length >= 3) {
      inputs[0].value = p.nome;
      inputs[1].value = qtd;
      inputs[2].value = p.valor || "";
      inputs[2].dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function ensureBackupCard() {
    if ($("backupCard")) return;
    const panel = $("panelDados");
    if (!panel) return;
    const card = document.createElement("div");
    card.className = "dados-card";
    card.id = "backupCard";
    card.innerHTML = `<div class="sec-title">Backup dos dados</div><div class="backup-box"><p><strong>Onde os dados ficam salvos:</strong> seus dados, produtos, logomarca e orçamentos ficam guardados no navegador deste aparelho.</p><p><strong>Por que fazer backup:</strong> se limpar os dados do navegador, trocar de celular, desinstalar o app ou reinstalar, essas informações podem sumir. O backup cria um arquivo para restaurar tudo depois.</p><ul><li>Para fazer backup, toque em <strong>Baixar backup</strong> e guarde o arquivo em local seguro.</li><li>Para restaurar, instale/abra o app, entre com a senha, escolha o arquivo em <strong>Restaurar backup</strong> e confirme.</li><li>Depois de restaurar, feche e abra o app novamente.</li></ul></div><div class="fgroup" style="margin-top:12px"><label class="lbl">Lembrete de backup</label><select id="backupPeriodo"><option value="0">Sem alerta</option><option value="7">A cada 7 dias</option><option value="15">A cada 15 dias</option><option value="30">A cada 30 dias</option><option value="60">A cada 60 dias</option></select></div><div class="backup-actions"><button type="button" id="btnBackup">Baixar backup</button><button type="button" id="btnMarcarBackup">Marcar como feito</button><input type="file" id="backupArquivo" accept="application/json"><button type="button" id="btnRestaurarBackup">Restaurar backup</button><button type="button" id="btnLimparHistorico">Limpar histórico</button></div><p class="backup-small" id="backupStatus"></p>`;
    panel.insertBefore(card, panel.querySelector(".senha-card"));
    $("backupPeriodo").value = localStorage.getItem(K.backupDias) || "0";
    $("backupPeriodo").onchange = () => { localStorage.setItem(K.backupDias, $("backupPeriodo").value); updateBackupStatus(); };
    $("btnBackup").onclick = downloadBackup;
    $("btnMarcarBackup").onclick = () => { localStorage.setItem(K.backupUltimo, new Date().toISOString()); updateBackupStatus(); alert("Backup marcado como feito."); };
    $("btnRestaurarBackup").onclick = restoreBackup;
    $("btnLimparHistorico").onclick = clearHistory;
    updateBackupStatus();
  }

  function saveCurrentBudget(status) {
    const text = ($("previaTexto")?.textContent || "").trim();
    if (!text || text.includes("Preencha o orçamento")) return;
    const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), criadoEm: new Date().toISOString(), status, cliente: ($("fCliente")?.value || "Cliente sem nome").trim(), tema: ($("fTema")?.value || "").trim(), totalTxt: ($("fTotal")?.textContent || "").trim(), texto: text };
    const list = json(K.orcamentos, []);
    const old = list.find(o => o.texto === item.texto);
    if (old) { old.status = status; old.atualizadoEm = new Date().toISOString(); }
    else list.unshift(item);
    save(K.orcamentos, list.slice(0, 200));
    renderHistory();
  }

  function renderHistory() {
    const box = $("histList");
    if (!box) return;
    const q = ($("histBusca")?.value || "").toLowerCase();
    const list = json(K.orcamentos, []).filter(o => !q || `${o.cliente} ${o.tema} ${o.texto}`.toLowerCase().includes(q));
    if (!list.length) { box.innerHTML = '<div class="hist-empty">Nenhum orçamento salvo ainda.</div>'; return; }
    box.innerHTML = "";
    list.forEach(o => {
      const card = document.createElement("div");
      card.className = "hist-card";
      card.innerHTML = `<div class="hist-top"><div><div class="hist-title">${esc(o.cliente || "Cliente")}</div><div class="hist-meta">${esc(o.status || "Salvo")} - ${dataBR(o.criadoEm)}${o.tema ? " - " + esc(o.tema) : ""}</div></div><div class="hist-total">${esc(o.totalTxt || "")}</div></div><div class="hist-actions"><button type="button" data-a="ver">Ver texto</button><button type="button" data-a="copiar">Copiar</button><button type="button" data-a="whats">WhatsApp</button><button type="button" class="danger" data-a="excluir">Excluir</button></div><div class="hist-text"></div>`;
      const t = card.querySelector(".hist-text");
      t.textContent = o.texto || "";
      card.querySelector('[data-a="ver"]').onclick = () => { t.style.display = t.style.display === "block" ? "none" : "block"; };
      card.querySelector('[data-a="copiar"]').onclick = () => navigator.clipboard.writeText(o.texto || "").then(() => alert("Orçamento copiado."));
      card.querySelector('[data-a="whats"]').onclick = () => { const w = String(json(K.dados, {}).wpp || "").replace(/\D/g, ""); window.open(`https://wa.me/${w}?text=${encodeURIComponent(o.texto || "")}`, "_blank"); };
      card.querySelector('[data-a="excluir"]').onclick = () => { if (confirm("Excluir este orçamento do histórico?")) { save(K.orcamentos, json(K.orcamentos, []).filter(x => x.id !== o.id)); renderHistory(); } };
      box.appendChild(card);
    });
  }

  function clearHistory() {
    if (!confirm("Apagar todos os orçamentos salvos? Faça backup antes se quiser guardar.")) return;
    localStorage.removeItem(K.orcamentos);
    renderHistory();
    alert("Histórico apagado.");
  }

  function downloadBackup() {
    const backup = { versao: 1, criadoEm: new Date().toISOString(), dados: json(K.dados, {}), logo: localStorage.getItem(K.logo) || "", produtos: json(K.produtos, []), orcamentos: json(K.orcamentos, []), senha: localStorage.getItem(K.senha) || "" };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `orcamento-express-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    localStorage.setItem(K.backupUltimo, new Date().toISOString());
    updateBackupStatus();
  }

  function restoreBackup() {
    const file = $("backupArquivo")?.files?.[0];
    if (!file) { alert("Escolha o arquivo de backup primeiro."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const b = JSON.parse(reader.result);
        if (!confirm("Restaurar este backup? Os dados atuais serão substituídos.")) return;
        save(K.dados, b.dados || {}); save(K.produtos, b.produtos || []); save(K.orcamentos, b.orcamentos || []);
        b.logo ? localStorage.setItem(K.logo, b.logo) : localStorage.removeItem(K.logo);
        if (b.senha) localStorage.setItem(K.senha, b.senha);
        alert("Backup restaurado. Feche e abra o app novamente para atualizar tudo.");
      } catch { alert("Arquivo de backup inválido."); }
    };
    reader.readAsText(file);
  }

  function updateBackupStatus() {
    const out = $("backupStatus");
    if (!out) return;
    const dias = Number(localStorage.getItem(K.backupDias) || 0);
    const last = localStorage.getItem(K.backupUltimo);
    out.textContent = last ? `Último backup: ${dataBR(last)}${dias ? ` - alerta a cada ${dias} dias` : ""}` : (dias ? `Alerta configurado a cada ${dias} dias. Nenhum backup registrado ainda.` : "Nenhum alerta de backup configurado.");
  }

  function checkBackupReminder() {
    const dias = Number(localStorage.getItem(K.backupDias) || 0);
    if (!dias) return;
    const last = localStorage.getItem(K.backupUltimo);
    const due = !last || (Date.now() - new Date(last).getTime()) / 86400000 >= dias;
    if (due && sessionStorage.getItem("orc_backup_alertado") !== "1") {
      sessionStorage.setItem("orc_backup_alertado", "1");
      setTimeout(() => alert("Lembrete: faça backup do Orçamento Express para proteger seus dados, produtos, logomarca e orçamentos salvos."), 800);
    }
  }

  function cleanPdfText(text) {
    return String(text || "")
      .replace(/[💌👤🎉📅🚚📦🧾💰💳📌💵💸📝✨🎀]/g, "")
      .replace(/⚠️|⚠/g, "Atenção:")
      .replace(/•/g, "-")
      .replace(/[—–]/g, "-")
      .replace(/[─]+/g, "------------------------------")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
      .replace(/[*_`]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  async function makePdfBlob() {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) return null;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const dados = json(K.dados, {});
    const logo = localStorage.getItem(K.logo) || "";
    const text = cleanPdfText($("previaTexto")?.textContent || "");
    let y = 20;
    if (logo) { try { doc.addImage(logo, "PNG", 14, 12, 24, 24); } catch {} }
    doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(140, 123, 255);
    doc.text(dados.atelie || "Orçamento Express", logo ? 44 : 14, 22);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(120, 108, 159);
    doc.text("Orçamento gerado pelo Orçamento Express", logo ? 44 : 14, 29);
    doc.setDrawColor(255, 123, 172); doc.line(14, 40, 196, 40);
    y = 50; doc.setTextColor(55, 55, 55); doc.setFontSize(11);
    doc.splitTextToSize(text, 180).forEach(line => { if (y > 280) { doc.addPage(); y = 18; } doc.text(line, 14, y); y += 6; });
    return doc.output("blob");
  }

  async function downloadPdfFixed() {
    const blob = await makePdfBlob();
    if (!blob) { alert("Não foi possível gerar o PDF neste navegador."); return; }
    const name = String($("fCliente")?.value || "orcamento").toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "") || "orcamento";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name}.pdf`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    saveCurrentBudget("PDF baixado");
  }

  async function sharePdfFixed() {
    const blob = await makePdfBlob();
    if (!blob) { alert("Não foi possível gerar o PDF neste navegador."); return; }
    const file = new File([blob], "orcamento.pdf", { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Orçamento", text: "Segue o orçamento em PDF." });
      saveCurrentBudget("PDF compartilhado");
    } else alert("Este aparelho não permite compartilhar PDF direto. Use o botão Baixar PDF com logo.");
  }

  function interceptPdfButtons() {
    $("btnPdf")?.addEventListener("click", e => { e.preventDefault(); e.stopImmediatePropagation(); downloadPdfFixed(); }, true);
    $("btnSharePdf")?.addEventListener("click", e => { e.preventDefault(); e.stopImmediatePropagation(); sharePdfFixed(); }, true);
  }

  function hookSaves() {
    $("btnGerar")?.addEventListener("click", () => setTimeout(() => saveCurrentBudget("Gerado"), 400));
    $("btnWpp")?.addEventListener("click", () => saveCurrentBudget("Enviado pelo WhatsApp"));
  }

  function init() {
    style();
    ensureHistoryTab();
    ensureProductPicker();
    ensureBackupCard();
    hookSaves();
    interceptPdfButtons();
    renderHistory();
    checkBackupReminder();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
