(() => {
  const K_ORC = "orc_orcamentos";
  const K_DADOS = "orc_dados";
  const $ = id => document.getElementById(id);
  const load = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };
  const save = (k, value) => localStorage.setItem(k, JSON.stringify(value));
  const cleanPix = text => String(text || "")
    .replace(/\n💸 \*Pix:\*/g, "\n*Pix:*")
    .replace(/\n💸 Pix:/g, "\nPix:")
    .replace(/💸 \*Pix:\*/g, "*Pix:*")
    .replace(/💸 Pix:/g, "Pix:");

  function normalizePhone(value) {
    let digits = String(value || "").replace(/\D/g, "");
    if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) digits = "55" + digits;
    return digits;
  }

  function whatsUrl(text, phone) {
    const digits = normalizePhone(phone);
    const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
    return `${base}?text=${encodeURIComponent(text)}`;
  }

  function clienteWpp() {
    return $("fClienteWpp")?.value || "";
  }

  function ensureClientField() {
    if ($("fClienteWpp")) return;
    const cliente = $("fCliente");
    const group = cliente?.closest(".fgroup");
    if (!group) return;
    const wrap = document.createElement("div");
    wrap.className = "fgroup";
    wrap.innerHTML = '<label class="lbl">WhatsApp da cliente</label><input type="text" id="fClienteWpp" placeholder="DDD + número. Se deixar vazio, você escolhe no WhatsApp.">';
    group.insertAdjacentElement("afterend", wrap);
  }

  function saveCurrentBudget(status) {
    const text = cleanPix(($("previaTexto")?.textContent || "").trim());
    if (!text || text.includes("Preencha o orçamento")) return;
    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      criadoEm: new Date().toISOString(),
      status,
      categoria: "Aguardando aprovação",
      cliente: ($("fCliente")?.value || "Cliente sem nome").trim(),
      clienteWpp: clienteWpp().trim(),
      tema: ($("fTema")?.value || "").trim(),
      totalTxt: ($("fTotal")?.textContent || "").trim(),
      texto: text
    };
    const list = load(K_ORC, []);
    const existing = list.find(o => cleanPix(o.texto || "") === item.texto);
    if (existing) {
      existing.status = status;
      existing.clienteWpp = item.clienteWpp;
      existing.atualizadoEm = new Date().toISOString();
      if (!existing.categoria) existing.categoria = "Aguardando aprovação";
    } else {
      list.unshift(item);
    }
    save(K_ORC, list.slice(0, 200));
  }

  function findHistoryPhone(text) {
    const clean = cleanPix(text || "");
    const item = load(K_ORC, []).find(o => cleanPix(o.texto || "") === clean);
    return item?.clienteWpp || "";
  }

  function sendText(text, phone, status) {
    const clean = cleanPix(text);
    if (!clean) return;
    if (status) saveCurrentBudget(status);
    window.open(whatsUrl(clean, phone), "_blank");
  }

  function interceptWhatsApp() {
    document.addEventListener("click", e => {
      const mainBtn = e.target.closest?.("#btnWpp");
      if (mainBtn) {
        const text = ($("previaTexto")?.textContent || "").trim();
        if (!text) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        sendText(text, clienteWpp(), "Enviado pelo WhatsApp");
        return;
      }

      const pixBtn = e.target.closest?.("#btnWppPix");
      if (pixBtn) {
        const dados = load(K_DADOS, {});
        const pix = ($("dPix")?.value || dados.pix || "").trim();
        if (!pix) return;
        const tipo = $("dTipoPix")?.value || dados.tipoPix || "Pix";
        const nome = ($("dNomePix")?.value || dados.nomePix || "").trim();
        const atelie = ($("dAtelie")?.value || dados.atelie || "").trim();
        const text = `Chave Pix (${tipo}): ${pix}${nome ? `\nNome: ${nome}` : ""}${atelie ? `\n${atelie}` : ""}`;
        e.preventDefault();
        e.stopImmediatePropagation();
        window.open(whatsUrl(text, clienteWpp()), "_blank");
        return;
      }

      const historyBtn = e.target.closest?.('.hist-actions [data-a="whats"]');
      if (historyBtn) {
        const card = historyBtn.closest(".hist-card");
        const text = card?.querySelector(".hist-text")?.textContent || "";
        if (!text) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        window.open(whatsUrl(cleanPix(text), findHistoryPhone(text)), "_blank");
      }
    }, true);
  }

  function init() {
    ensureClientField();
    interceptWhatsApp();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
