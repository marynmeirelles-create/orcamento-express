(() => {
  const K_DADOS = "orc_dados";
  const K_LOGO = "orc_logo";
  const K_PRODUTOS = "orc_produtos";
  const K_ORCAMENTOS = "orc_orcamentos";
  const K_BACKUP_DIAS = "orc_backup_dias";
  const K_BACKUP_ULTIMO = "orc_backup_ultimo";
  const K_SENHA = "orc_senha";

  const $ = id => document.getElementById(id);
  const fmt = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dataBR = iso => {
    if (!iso) return "";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("pt-BR");
  };
  const loadJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };
  const saveJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  function injectStyle() {
    const style = document.createElement("style");
    style.textContent = `
      .hist-list{display:flex;flex-direction:column;gap:10px;margin-top:10px;}
      .hist-card{background:#fff;border:1px solid #F2EAF8;border-radius:16px;padding:12px;box-shadow:0 5px 14px rgba(0,0,0,.04);}
      .hist-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:8px;}
      .hist-title{font-size:13px;font-weight:800;color:#7a3a6b;line-height:1.3;}
      .hist-meta{font-size:10px;color:#a08fc7;margin-top:3px;}
      .hist-total{font-size:12px;font-weight:800;color:#8C7BFF;white-space:nowrap;}
      .hist-text{font-size:11px;color:#7a6c9f;white-space:pre-wrap;line-height:1.55;background:#FFF9FC;border-radius:12px;padding:10px;margin-top:8px;display:none;}
      .hist-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;}
      .hist-actions button,.backup-actions button{border:none;border-radius:999px;padding:9px 10px;font-size:11px;font-weight:700;cursor:pointer;background:#F0EDFF;color:#8C7BFF;font-family:'Poppins',sans-serif;}
      .hist-actions .danger{background:#FFE4E4;color:#c73232;}
      .backup-box,.prod-picker{background:#FFF9FC;border:1px solid #F2EAF8;border-radius:16px;padding:12px;margin-top:8px;}
      .backup-box p,.backup-box li{font-size:11px;color:#7a6c9f;line-height:1.55;}
      .backup-box ul{padding-left:18px;margin:8px 0;}
      .backup-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;}
      .backup-actions input[type=file]{grid-column:1/-1;border-radius:14px;font-size:12px;background:#fff;}
      .backup-small{font-size:10px;color:#a08fc7;margin-top:8px;line-height:1.45;}
      .hist-empty{font-size:12px;color:#a08fc7;text-align:center;background:#FFF9FC;border-radius:14px;padding:16px;}
      .prod-picker-title{font-size:12px;font-weight:800;color:#7a3a6b;margin-bottom:8px;}
      .prod-picker-grid{display:grid;grid-template-columns:1fr 76px;gap:8px;align-items:end;}
      .prod-picker button{grid-column:1/-1;border:none;border-radius:999px;padding:11px;background:#F0EDFF;color:#8C7BFF;font-size:12px;font-weight:800;cursor:pointer;font-family:'Poppins',sans-serif;}
      .prod-picker .hint{grid-column:1/-1;margin-top:2px;}
    `;
    document.head.appendChild(style);
  }

  function ensureTabs() {
    const tabs = document.querySelector(".tabs");
    const main = document.querySelector("main");
    if (!tabs || !main || $("panelHistorico")) return;

    const tab = document.createElement("div");
    tab.className = "tab";
    tab.dataset.tab = "historico";
    tab.textContent = "Histórico";
    tabs.insertBefore(tab, tabs.querySelector('[data-tab="dados"]'));

    const panel = document.createElement("div");
    panel.id = "panelHistorico";
    panel.className = "panel";
    panel.innerHTML = `
      <div class="fcard">
        <div class="sec-title">Catálogo de orçamentos</div>
        <div class="fgroup"><label class="lbl">Buscar por cliente, tema ou item</label><input type="text" id="histBusca" placeholder="Digite para buscar"></div>
        <div class="hist-list" id="histList"></div>
      </div>
    `;
    const dados = $("panelDados");
    main.insertBefore(panel, dados || null);

    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
      panel.classList.add("active");
      renderHistorico();
    };
    $("histBusca").oninput = renderHistorico;
  }

  function ensureProductPicker() {
    if ($("prodPicker")) return;
    const list = $("iList");
    if (!list) return;
    const picker = document.createElement("div");
    picker.className = "prod-picker";
    picker.id = "prodPicker";
    picker.innerHTML = `
      <div class="prod-picker-title">Inserir produto cadastrado</div>
      <div class="prod-picker-grid">
        <div><label class="mini-label">Produto salvo</label><select id="prodEscolhido"></select></div>
        <div><label class="mini-label">Qtd.</label><input type="number" id="prodQtd" min="1" step="1" value="1"></div>
        <button type="button" id="btnInserirProduto">Inserir no orçamento</button>
        <p class="hint">Cadastre produtos em Meus dados. Depois escolha aqui para preencher o orçamento automaticamente.</p>
      </div>
    `;
    list.parentElement.insertBefore(picker, list);
    $("btnInserirProduto").onclick = inserirProdutoNoOrcamento;
    renderProdutosPicker();
  }

  function renderProdutosPicker() {
    const select = $("prodEscolhido");
    if (!select) return;
    const produtos = loadJSON(K_PRODUTOS, []);
    select.innerHTML = produtos.length
      ? produtos.map((p, i) => `<option value="${i}">${escapeHTML(p.nome)} - ${fmt(p.valor)}</option>`).join("")
      : '<option value="">Nenhum produto cadastrado</option>';
  }

  function inserirProdutoNoOrcamento() {
    const produtos = loadJSON(K_PRODUTOS, []);
    const idx = Number($("prodEscolhido")?.value);
    const p = produtos[idx];
    if (!p) { alert("Cadastre um produto em Meus dados primeiro."); return; }
    const qtd = Math.max(1, parseInt($("prodQtd")?.value || "1"));
    if (typeof window.addItemRow === "function") {
      window.addItemRow(p.nome, String(qtd), String(p.valor || ""));
      return;
    }
    const btn = $("btnAddItem");
    btn?.click();
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
    const panel = $("panelDados");
    if (!panel || $("backupCard")) return;
    const card = document.createElement("div");
    card.className = "dados-card";
    card.id = "backupCard";
    card.innerHTML = `
      <div class="sec-title">Backup dos dados</div>
      <div class="backup-box">
        <p><strong>Onde os dados ficam salvos:</strong> seus dados, produtos, logomarca e orçamentos ficam guardados no navegador deste aparelho.</p>
        <p><strong>Por que fazer backup:</strong> se limpar os dados do navegador, trocar de celular, desinstalar o app ou reinstalar, essas informações podem sumir. O backup cria um arquivo para restaurar tudo depois.</p>
        <ul>
          <li>Para fazer backup, toque em <strong>Baixar backup</strong> e guarde o arquivo em local seguro.</li>
          <li>Para restaurar, instale/abra o app, entre com a senha, escolha o arquivo em <strong>Restaurar backup</strong> e confirme.</li>
          <li>Depois de restaurar, feche e abra o app novamente.</li>
        </ul>
      </div>
      <div class="fgroup" style="margin-top:12px"><label class="lbl">Lembrete de backup</label><select id="backupPeriodo"><option value="0">Sem alerta</option><option value="7">A cada 7 dias</option><option value="15">A cada 15 dias</option><option value="30">A cada 30 dias</option><option value="60">A cada 60 dias</option></select></div>
      <div class="backup-actions"><button type="button" id="btnBackup">Baixar backup</button><button type="button" id="btnMarcarBackup">Marcar como feito</button><input type="file" id="backupArquivo" accept="application/json"><button type="button" id="btnRestaurarBackup">Restaurar backup</button><button type="button" id="btnLimparHistorico">Limpar histórico</button></div>
      <p class="backup-small" id="backupStatus"></p>
    `;
    const senhaCard = panel.querySelector(".senha-card");
    panel.insertBefore(card, senhaCard || null);

    $("backupPeriodo").value = localStorage.getItem(K_BACKUP_DIAS) || "0";
    $("backupPeriodo").onchange = () => {
      localStorage.setItem(K_BACKUP_DIAS, $("backupPeriodo").value);
      updateBackupStatus();
    };
    $("btnBackup").onclick = baixarBackup;
    $("btnMarcarBackup").onclick = () => {
      localStorage.setItem(K_BACKUP_ULTIMO, new Date().toISOString());
      updateBackupStatus();
      alert("Backup marcado como feito.");
    };
    $("btnRestaurarBackup").onclick = restaurarBackup;
    $("btnLimparHistorico").onclick = limparHistorico;
    updateBackupStatus();
  }

  function readOrcamentoDaTela(status) {
    const texto = ($("previaTexto")?.textContent || "").trim();
    if (!texto || texto.includes("Preencha o orçamento")) return null;
    const cliente = ($("fCliente")?.value || "Cliente sem nome").trim();
    const tema = ($("fTema")?.value || "").trim();
    const totalTxt = ($("fTotal")?.textContent || "").trim();
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      criadoEm: new Date().toISOString(),
      status,
      cliente,
      tema,
      totalTxt,
      texto
    };
  }

  function salvarOrcamento(status = "Gerado") {
    const atual = readOrcamentoDaTela(status);
    if (!atual) return;
    const lista = loadJSON(K_ORCAMENTOS, []);
    const mesmoTexto = lista.find(o => o.texto === atual.texto);
    if (mesmoTexto) {
      mesmoTexto.status = status;
      mesmoTexto.atualizadoEm = new Date().toISOString();
    } else {
      lista.unshift(atual);
    }
    saveJSON(K_ORCAMENTOS, lista.slice(0, 200));
    renderHistorico();
  }

  function renderHistorico() {
    const box = $("histList");
    if (!box) return;
    const termo = ($("histBusca")?.value || "").toLowerCase();
    const lista = loadJSON(K_ORCAMENTOS, []).filter(o => !termo || `${o.cliente} ${o.tema} ${o.texto}`.toLowerCase().includes(termo));
    if (!lista.length) {
      box.innerHTML = '<div class="hist-empty">Nenhum orçamento salvo ainda.</div>';
      return;
    }
    box.innerHTML = "";
    lista.forEach(o => {
      const card = document.createElement("div");
      card.className = "hist-card";
      card.innerHTML = `
        <div class="hist-top"><div><div class="hist-title">${escapeHTML(o.cliente || "Cliente")}</div><div class="hist-meta">${escapeHTML(o.status || "Salvo")} - ${dataBR(o.criadoEm)}${o.tema ? " - " + escapeHTML(o.tema) : ""}</div></div><div class="hist-total">${escapeHTML(o.totalTxt || "")}</div></div>
        <div class="hist-actions"><button type="button" data-action="ver">Ver texto</button><button type="button" data-action="copiar">Copiar</button><button type="button" data-action="whats">WhatsApp</button><button type="button" class="danger" data-action="excluir">Excluir</button></div>
        <div class="hist-text"></div>
      `;
      const text = card.querySelector(".hist-text");
      text.textContent = o.texto || "";
      card.querySelector('[data-action="ver"]').onclick = () => { text.style.display = text.style.display === "block" ? "none" : "block"; };
      card.querySelector('[data-action="copiar"]').onclick = () => navigator.clipboard.writeText(o.texto || "").then(() => alert("Orçamento copiado."));
      card.querySelector('[data-action="whats"]').onclick = () => {
        const dados = loadJSON(K_DADOS, {});
        const wpp = dados.wpp ? String(dados.wpp).replace(/\D/g, "") : "";
        window.open(`https://wa.me/${wpp}?text=${encodeURIComponent(o.texto || "")}`, "_blank");
      };
      card.querySelector('[data-action="excluir"]').onclick = () => excluirOrcamento(o.id);
      box.appendChild(card);
    });
  }

  function excluirOrcamento(id) {
    if (!confirm("Excluir este orçamento do histórico?")) return;
    saveJSON(K_ORCAMENTOS, loadJSON(K_ORCAMENTOS, []).filter(o => o.id !== id));
    renderHistorico();
  }

  function limparHistorico() {
    if (!confirm("Apagar todos os orçamentos salvos? Faça backup antes se quiser guardar.")) return;
    localStorage.removeItem(K_ORCAMENTOS);
    renderHistorico();
    alert("Histórico apagado.");
  }

  function baixarBackup() {
    const backup = {
      versao: 1,
      criadoEm: new Date().toISOString(),
      dados: loadJSON(K_DADOS, {}),
      logo: localStorage.getItem(K_LOGO) || "",
      produtos: loadJSON(K_PRODUTOS, []),
      orcamentos: loadJSON(K_ORCAMENTOS, []),
      senha: localStorage.getItem(K_SENHA) || ""
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const data = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `orcamento-express-backup-${data}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    localStorage.setItem(K_BACKUP_ULTIMO, new Date().toISOString());
    updateBackupStatus();
  }

  function restaurarBackup() {
    const file = $("backupArquivo")?.files?.[0];
    if (!file) { alert("Escolha o arquivo de backup primeiro."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const b = JSON.parse(reader.result);
        if (!confirm("Restaurar este backup? Os dados atuais serão substituídos.")) return;
        saveJSON(K_DADOS, b.dados || {});
        saveJSON(K_PRODUTOS, b.produtos || []);
        saveJSON(K_ORCAMENTOS, b.orcamentos || []);
        if (b.logo) localStorage.setItem(K_LOGO, b.logo); else localStorage.removeItem(K_LOGO);
        if (b.senha) localStorage.setItem(K_SENHA, b.senha);
        localStorage.setItem(K_BACKUP_ULTIMO, new Date().toISOString());
        alert("Backup restaurado. Feche e abra o app novamente para atualizar tudo.");
      } catch {
        alert("Arquivo de backup inválido.");
      }
    };
    reader.readAsText(file);
  }

  function updateBackupStatus() {
    const out = $("backupStatus");
    if (!out) return;
    const dias = Number(localStorage.getItem(K_BACKUP_DIAS) || 0);
    const ultimo = localStorage.getItem(K_BACKUP_ULTIMO);
    out.textContent = ultimo ? `Último backup: ${dataBR(ultimo)}${dias ? ` - alerta a cada ${dias} dias` : ""}` : (dias ? `Alerta configurado a cada ${dias} dias. Nenhum backup registrado ainda.` : "Nenhum alerta de backup configurado.");
  }

  function checkBackupReminder() {
    const dias = Number(localStorage.getItem(K_BACKUP_DIAS) || 0);
    if (!dias) return;
    const ultimo = localStorage.getItem(K_BACKUP_ULTIMO);
    const due = !ultimo || (Date.now() - new Date(ultimo).getTime()) / 86400000 >= dias;
    if (!due || sessionStorage.getItem("orc_backup_alertado") === "1") return;
    sessionStorage.setItem("orc_backup_alertado", "1");
    setTimeout(() => alert("Lembrete: faça backup do Orçamento Express para proteger seus dados, produtos, logomarca e orçamentos salvos."), 800);
  }

  function hookExistingButtons() {
    $("btnGerar")?.addEventListener("click", () => setTimeout(() => salvarOrcamento("Gerado"), 400));
    $("btnWpp")?.addEventListener("click", () => salvarOrcamento("Enviado pelo WhatsApp"));
    $("btnPdf")?.addEventListener("click", () => salvarOrcamento("PDF baixado"));
    $("btnSharePdf")?.addEventListener("click", () => salvarOrcamento("PDF compartilhado"));
  }

  function textoParaPdf(texto) {
    return String(texto || "")
      .replace(/💌/g, "")
      .replace(/👤/g, "Cliente:")
      .replace(/🎉/g, "Tema:")
      .replace(/📅/g, "Data:")
      .replace(/🚚/g, "Entrega/Frete:")
      .replace(/📦/g, "Itens:")
      .replace(/🧾/g, "Subtotal:")
      .replace(/💰/g, "Total:")
      .replace(/💳/g, "Pagamento:")
      .replace(/📌/g, "Parcelamento:")
      .replace(/⚠️|⚠/g, "Atenção:")
      .replace(/💵/g, "Pagamento:")
      .replace(/💸/g, "Pix:")
      .replace(/📝/g, "Observação:")
      .replace(/✨/g, "")
      .replace(/🎀/g, "")
      .replace(/[•]/g, "-")
      .replace(/[—–]/g, "-")
      .replace(/[─]+/g, "------------------------------")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
      .replace(/[*_`]/g, "")
      .replace(/\s+:/g, ":")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function corrigirPdf() {
    const originalBaixar = window.baixarPdf;
    const originalCompartilhar = window.compartilharPdf;

    window.criarPdfBlob = function criarPdfBlobCorrigido() {
      return new Promise(resolve => {
        const jsPDF = window.jspdf?.jsPDF;
        if (!jsPDF || !window.ultimoOrcamento) { resolve(null); return; }
        const doc = new jsPDF({ unit: "mm", format: "a4" });
        const dados = window.ultimoOrcamento.dados || loadJSON(K_DADOS, {});
        const logo = window.ultimoOrcamento.logo || localStorage.getItem(K_LOGO) || "";
        const texto = textoParaPdf(window.ultimoOrcamento.texto || "");
        let y = 20;
        if (logo) {
          try { doc.addImage(logo, "PNG", 14, 12, 24, 24); } catch {}
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.setTextColor(140, 123, 255);
        doc.text(dados.atelie || "Orçamento Express", logo ? 44 : 14, 22);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(120, 108, 159);
        doc.text("Orçamento gerado pelo Orçamento Express", logo ? 44 : 14, 29);
        doc.setDrawColor(255, 123, 172);
        doc.line(14, 40, 196, 40);
        y = 50;
        doc.setTextColor(55, 55, 55);
        doc.setFontSize(11);
        doc.splitTextToSize(texto, 180).forEach(line => {
          if (y > 280) { doc.addPage(); y = 18; }
          doc.text(line, 14, y);
          y += 6;
        });
        resolve(doc.output("blob"));
      });
    };

    if (typeof originalBaixar === "function") window.baixarPdf = originalBaixar;
    if (typeof originalCompartilhar === "function") window.compartilharPdf = originalCompartilhar;
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>'"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch]));
  }

  function init() {
    injectStyle();
    ensureTabs();
    ensureProductPicker();
    ensureBackupCard();
    hookExistingButtons();
    corrigirPdf();
    renderHistorico();
    checkBackupReminder();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
