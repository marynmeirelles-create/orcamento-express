(() => {
  const K={dados:"orc_dados",logo:"orc_logo",produtos:"orc_produtos",orcamentos:"orc_orcamentos",backupDias:"orc_backup_dias",backupUltimo:"orc_backup_ultimo",senha:"orc_senha",aba:"orc_aba_ativa"};
  const $=id=>document.getElementById(id);
  const json=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f));}catch{return f;}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const fmt=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const pv=v=>Number(String(v||0).replace(/[^\d,.-]/g,"").replace(/\./g,"").replace(",","."))||0;
  const esc=v=>String(v||"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const dataBR=iso=>iso?new Date(iso).toLocaleString("pt-BR"):"";
  const cleanPix=t=>String(t||"").replace(/\n💸 \*Pix:\*/g,"\n*Pix:*").replace(/\n💸 Pix:/g,"\nPix:").replace(/💸 \*Pix:\*/g,"*Pix:*").replace(/💸 Pix:/g,"Pix:");

  function style(){const s=document.createElement("style");s.textContent=`
    #panelProdutos #prodList{display:none!important}.hist-list,.prod-list{display:flex;flex-direction:column;gap:10px;margin-top:10px}.hist-card,.prod-row,.prod-picker,.backup-box{background:#FFF9FC;border:1px solid #F2EAF8;border-radius:16px;padding:12px}.hist-card{box-shadow:0 5px 14px rgba(0,0,0,.04)}.hist-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.hist-title{font-size:13px;font-weight:800;color:#7a3a6b}.hist-meta,.hist-text,.backup-small,.backup-box p,.backup-box li{font-size:11px;color:#7a6c9f;line-height:1.55}.hist-total{font-size:12px;font-weight:800;color:#8C7BFF;white-space:nowrap}.hist-cat{margin-top:8px;display:grid;gap:5px}.hist-cat label,.hist-edit label{font-size:10px;font-weight:800;color:#7a3a6b}.hist-cat select,.hist-edit input,.hist-edit select,.hist-edit textarea{width:100%;box-sizing:border-box;border:1px solid #F2EAF8;border-radius:12px;padding:10px;background:#fff;color:#5d527c;font-family:'Poppins',sans-serif;font-size:12px}.hist-edit textarea{min-height:170px;resize:vertical;line-height:1.5}.hist-edit{display:none;margin-top:10px;background:#fff;border-radius:14px;padding:10px;border:1px solid #F2EAF8}.hist-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.hist-edit-grid .full{grid-column:1/-1}.hist-item-list{display:flex;flex-direction:column;gap:8px;margin-top:6px}.hist-item-row{display:grid;grid-template-columns:1fr 58px 76px 32px;gap:6px;align-items:end;background:#FFF9FC;border:1px solid #F2EAF8;border-radius:14px;padding:8px}.hist-item-row .prod{grid-column:1/-1}.hist-item-row .del{min-height:34px;padding:6px;border-radius:50%;background:#FFE4E4;color:#c73232}.hist-text{white-space:pre-wrap;background:#fff;border-radius:12px;padding:10px;margin-top:8px;display:none}.hist-actions,.backup-actions,.pix-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.prod-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.hist-actions button,.backup-actions button,.prod-picker button,.prod-actions button,.pix-actions button,.hist-edit button{border:none;border-radius:999px;padding:10px 14px;font-size:11px;font-weight:700;cursor:pointer;background:#F0EDFF;color:#8C7BFF;font-family:'Poppins',sans-serif;min-height:38px;line-height:1.2}.prod-actions button{white-space:nowrap;width:auto;min-width:max-content}.hist-actions button,.backup-actions button,.pix-actions button,.hist-edit button{white-space:normal}.hist-actions .danger,.prod-actions .danger{background:#FFE4E4;color:#c73232}.hist-actions .ok,.hist-edit .ok{background:#E9F8EF;color:#2d8a4e}.hist-edit-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.hist-empty{font-size:12px;color:#a08fc7;text-align:center;background:#FFF9FC;border-radius:14px;padding:16px}.backup-box ul{padding-left:18px;margin:8px 0}.backup-actions input[type=file]{grid-column:1/-1;border-radius:14px;font-size:12px;background:#fff}.prod-picker{margin:8px 0 12px}.prod-picker-title{font-size:12px;font-weight:800;color:#7a3a6b;margin-bottom:8px}.prod-picker-grid{display:grid;grid-template-columns:1fr 76px;gap:8px;align-items:end}.prod-picker button{grid-column:1/-1;padding:11px;font-size:12px}.prod-picker .hint{grid-column:1/-1;margin-top:2px}.prod-row{display:block;font-size:12px;color:#7a6c9f}.prod-row strong{color:#7a3a6b}.prod-search{margin-bottom:10px}.pix-actions{margin-top:-4px;margin-bottom:12px}@media(max-width:420px){.hist-edit-grid{grid-template-columns:1fr}.hist-actions{grid-template-columns:1fr 1fr}.hist-item-row{grid-template-columns:1fr 1fr 32px}.hist-item-row .prod{grid-column:1/-1}.prod-actions button{font-size:10px;padding-left:12px;padding-right:12px}}
  `;document.head.appendChild(s);}

  function panelId(name){return "panel"+name.charAt(0).toUpperCase()+name.slice(1);}
  function activate(tab,panel){if(!tab||!panel)return;document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));tab.classList.add("active");panel.classList.add("active");const name=tab.dataset.tab;if(name)localStorage.setItem(K.aba,name);if(name==="historico")renderHistory();if(name==="produtos")renderProducts();}
  function setTabByName(name){const tab=document.querySelector(`.tab[data-tab="${name}"]`),panel=$(panelId(name));if(tab&&panel)activate(tab,panel);}
  function setupTabMemory(){document.querySelectorAll(".tab").forEach(t=>{if(t.dataset.navReady)return;t.dataset.navReady="1";t.addEventListener("click",()=>{const name=t.dataset.tab;if(!name)return;localStorage.setItem(K.aba,name);if(location.hash!==`#${name}`)history.pushState({aba:name},"",`#${name}`);});});window.addEventListener("popstate",()=>setTabByName((location.hash||"").replace("#","")||localStorage.getItem(K.aba)||"form"));const initial=(location.hash||"").replace("#","")||localStorage.getItem(K.aba)||"form";if(!location.hash)history.replaceState({aba:initial},"",`#${initial}`);setTimeout(()=>setTabByName(initial),50);}
  function tab(id,label,before){const tabs=document.querySelector(".tabs"),main=document.querySelector("main");if(!tabs||!main||$(panelId(id.toLowerCase())))return null;const t=document.createElement("div");t.className="tab";t.dataset.tab=id.toLowerCase();t.textContent=label;tabs.insertBefore(t,tabs.querySelector(before));const p=document.createElement("div");p.id=`panel${id}`;p.className="panel";main.insertBefore(p,$("panelDados"));t.onclick=()=>activate(t,p);return p;}

  function ensureProductsTab(){const p=tab("Produtos","Produtos",'[data-tab="dados"]');if(!p)return;const old=$("btnSalvarProduto")?.closest(".dados-card");p.innerHTML=`<div class="dados-card"><div class="sec-title">Produtos cadastrados</div><div class="fgroup prod-search"><label class="lbl">Buscar produto</label><input type="text" id="prodBusca" placeholder="Digite para buscar"></div><div id="prodCadastroSlot"></div><div class="prod-list" id="produtosTabList"></div></div>`;if(old){$("prodCadastroSlot").appendChild(old);const oldList=$("prodList");if(oldList)oldList.style.display="none";}$("prodBusca").oninput=renderProducts;renderProducts();}
  function ensureHistoryTab(){const p=tab("Historico","Histórico",'[data-tab="dados"]');if(!p)return;p.innerHTML=`<div class="fcard"><div class="sec-title">Catálogo de orçamentos</div><div class="fgroup"><label class="lbl">Buscar por cliente, tema, categoria ou item</label><input type="text" id="histBusca" placeholder="Digite para buscar"></div><div class="hist-list" id="histList"></div></div>`;$("histBusca").oninput=renderHistory;}
  function renderProducts(){const box=$("produtosTabList");if(!box)return;const q=($("prodBusca")?.value||"").toLowerCase();const ps=json(K.produtos,[]).map((p,i)=>({...p,i})).filter(p=>!q||String(p.nome).toLowerCase().includes(q));if(!ps.length){box.innerHTML='<div class="hist-empty">Nenhum produto cadastrado ainda.</div>';return;}box.innerHTML="";ps.forEach(p=>{const r=document.createElement("div");r.className="prod-row";r.innerHTML=`<strong>${esc(p.nome)}</strong><br>${fmt(p.valor)}<div class="prod-actions"><button type="button" data-a="usar">Usar no orçamento</button><button type="button" class="danger" data-a="excluir">Excluir</button></div>`;r.querySelector('[data-a="usar"]').onclick=()=>useProduct(p.i);r.querySelector('[data-a="excluir"]').onclick=()=>deleteProduct(p.i);box.appendChild(r);});}
  function deleteProduct(i){if(!confirm("Excluir este produto cadastrado?"))return;const ps=json(K.produtos,[]);ps.splice(i,1);save(K.produtos,ps);atualizarProdutosUI();renderProducts();}
  function useProduct(i){const p=json(K.produtos,[])[i];if(!p)return;insertProduct(p,1);setTabByName("form");if(location.hash!=="#form")history.pushState({aba:"form"},"","#form");}
  function insertProduct(p,qtd=1){$("btnAddItem")?.click();const rows=document.querySelectorAll("#iList .irow"),row=rows[rows.length-1],ins=row?.querySelectorAll("input");if(ins?.length>=3){ins[0].value=p.nome;ins[1].value=qtd;ins[2].value=p.valor||"";ins[2].dispatchEvent(new Event("input",{bubbles:true}));}}

  function ensurePix(){if($("pixActions"))return;const pix=$("dPix");if(!pix)return;const b=document.createElement("div");b.id="pixActions";b.className="pix-actions";b.innerHTML=`<button type="button" id="btnCopiarPix">Copiar Pix</button><button type="button" id="btnWppPix">Enviar Pix no WhatsApp</button>`;pix.closest(".fgroup")?.insertAdjacentElement("afterend",b);$("btnCopiarPix").onclick=copyPix;$("btnWppPix").onclick=sendPix;}
  function pixText(){const d={tipo:$("dTipoPix")?.value||"Pix",pix:$("dPix")?.value.trim()||"",nome:$("dNomePix")?.value.trim()||"",atelie:$("dAtelie")?.value.trim()||""};if(!d.pix)return"";return`Chave Pix (${d.tipo}): ${d.pix}${d.nome?`\nNome: ${d.nome}`:""}${d.atelie?`\n${d.atelie}`:""}`;}
  function copyPix(){const t=pixText();if(!t){alert("Preencha a chave Pix primeiro.");return;}navigator.clipboard.writeText(t).then(()=>alert("Pix copiado."));}
  function sendPix(){const t=pixText();if(!t){alert("Preencha a chave Pix primeiro.");return;}const w=String($("dWpp")?.value||"").replace(/\D/g,"");window.open(`https://wa.me/${w}?text=${encodeURIComponent(t)}`,"_blank");}

  function ensureBackup(){if($("backupCard"))return;const p=$("panelDados");if(!p)return;const c=document.createElement("div");c.className="dados-card";c.id="backupCard";c.innerHTML=`<div class="sec-title">Backup dos dados</div><div class="backup-box"><p><strong>Onde o app guarda seus dados.</strong> Orçamentos, catálogo, logomarca e dados do ateliê ficam na área de armazenamento do Orçamento Express, no navegador e perfil usados neste aparelho. Você os encontra nas abas do app. O navegador guarda esses registros internamente.</p>
<p><strong>Como guardar uma cópia.</strong> Use Guardar cópia na nuvem e escolha uma pasta do Google Drive, iCloud Drive, OneDrive ou de outro serviço, se o aparelho mostrar essa opção. Cada backup é uma cópia daquele momento. Faça outro após alterações importantes.</p>
<p><strong>Onde encontrar o arquivo.</strong> Se você usar Baixar arquivo, procure por <strong>orcamento-express-backup-…json</strong> na pasta Downloads do navegador ou no app Arquivos. Depois mova uma cópia para a sua nuvem. Se escolher uma pasta diretamente, procure nela.</p>
<details><summary>Ajuda para guardar a cópia no celular</summary><p><strong>iPhone.</strong> No menu de compartilhamento, procure Salvar em Arquivos e escolha iCloud Drive. Se você baixou o arquivo, abra Arquivos e procure em Downloads para copiá-lo para a sua nuvem.</p><p><strong>Android.</strong> No menu de compartilhamento, procure o app da sua nuvem. Se você baixou o arquivo, abra Arquivos ou Meus Arquivos, encontre a cópia em Downloads e compartilhe com a sua nuvem.</p></details><p><strong>Como recuperar.</strong> Se trocar de aparelho ou apagar os dados do site, abra o Orçamento Express, entre e, em Dados → Backup dos dados, selecione o arquivo JSON e toque em Restaurar backup. A restauração substitui os dados locais atuais.</p></div><div class="fgroup" style="margin-top:12px"><p class="backup-small">O lembrete com os botões de backup aparece sempre que você salva um orçamento, inclusive ao editar. Os avisos abaixo são adicionais.</p><label class="lbl">Avisos adicionais ao abrir o app</label><select id="backupPeriodo"><option value="0">Somente ao salvar orçamento</option><option value="novo">Somente ao salvar orçamento (configuração anterior)</option><option value="3">A cada 3 dias</option><option value="7">A cada 7 dias</option><option value="14">A cada 14 dias</option><option value="30">A cada 30 dias</option></select></div><div class="backup-actions"><button type="button" id="btnBackup">Baixar arquivo</button><button type="button" id="btnBackupCloud">Guardar cópia na nuvem</button><button type="button" id="btnMarcarBackup">Marcar como feito</button><input type="file" id="backupArquivo" accept="application/json"><button type="button" id="btnRestaurarBackup">Restaurar backup</button><button type="button" id="btnLimparHistorico">Limpar histórico</button></div><p class="backup-small" id="backupStatus"></p>`;p.insertBefore(c,p.querySelector(".senha-card"));const sv=localStorage.getItem(K.backupDias)||"0";$("backupPeriodo").value=["0","novo","3","7","14","30"].includes(sv)?sv:"7";$("backupPeriodo").onchange=()=>{localStorage.setItem(K.backupDias,$("backupPeriodo").value);backupStatus();};$("btnBackup").onclick=downloadBackup;$("btnBackupCloud").onclick=()=>saveBackupToCloud();$("btnMarcarBackup").onclick=()=>{localStorage.setItem(K.backupUltimo,new Date().toISOString());backupStatus();alert("Backup marcado como feito.");};$("btnRestaurarBackup").onclick=restoreBackup;$("btnLimparHistorico").onclick=clearHistory;backupStatus();}
  function backupStatus(){const o=$("backupStatus");if(!o)return;const v=localStorage.getItem(K.backupDias)||"0",last=localStorage.getItem(K.backupUltimo);o.textContent=last?`Último backup: ${dataBR(last)}${v==="novo"?" - lembrete a cada orçamento salvo":Number(v)?` - alerta a cada ${v} dias`:""}`:(v==="novo"?"Lembrete ativo a cada orçamento salvo.":Number(v)?`Alerta configurado a cada ${v} dias. Nenhum backup registrado ainda.`:"Lembrete ativo a cada orçamento salvo.");}
  function checkBackup(){const v=localStorage.getItem(K.backupDias)||"0";if(!Number(v))return;const last=localStorage.getItem(K.backupUltimo),due=!last||(Date.now()-new Date(last).getTime())/86400000>=Number(v);if(due&&sessionStorage.getItem("orc_backup_alertado")!=="1"){sessionStorage.setItem("orc_backup_alertado","1");setTimeout(()=>alert("Lembrete: faça backup do Orçamento Express para proteger seus dados, produtos, logomarca e orçamentos salvos."),800);}}
  function backupFile() {
    const now = new Date().toISOString();
    const data = {
      versao: 1, criadoEm: now, dados: json(K.dados, {}), logo: localStorage.getItem(K.logo) || "",
      produtos: json(K.produtos, []), orcamentos: readHistory()
    };
    return new File([JSON.stringify(data, null, 2)], "orcamento-express-backup-" + now.slice(0, 10) + ".json", { type: "application/json" });
  }

  function markBackup() {
    localStorage.setItem(K.backupUltimo, new Date().toISOString());
    backupStatus();
  }

  function showSavedBackupReminder() {
    $("btnBackupDownloadSalvo").hidden = true;
    $("backupStatusSalvo").textContent = "";
    $("savedBackupReminder")?.remove();
    const dialog = document.createElement("dialog");
    dialog.id = "savedBackupReminder";
    dialog.setAttribute("aria-labelledby", "savedBackupTitle");
    dialog.style.cssText = "width:min(92vw,420px);margin:auto;padding:20px;border:1px solid #F2EAF8;border-radius:16px;color:#5d527c";
    dialog.innerHTML = '<h2 id="savedBackupTitle">Orçamento salvo!</h2>' +
      '<p>Guarde uma cópia atualizada na sua nuvem para recuperar seus dados se trocar ou perder o celular.</p><p role="status"></p>' +
      '<div class="backup-actions"><button type="button" data-cloud>Guardar cópia na nuvem</button>' +
      '<button type="button" data-download hidden>Baixar arquivo</button>' +
      '<button type="button" data-later>Agora não</button></div>';
    connectBackupDialog(dialog);
    dialog.addEventListener("close", () => dialog.remove());
    document.body.append(dialog);
    dialog.showModal();
  }

  function downloadBackup() {
    try {
      const file = backupFile();
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      markBackup();
      return true;
    } catch {
      alert("Não foi possível gerar a cópia. Confira os dados do app e tente novamente.");
    }
  }

  async function saveBackupToCloud(report = alert) {
    try {
      const file = backupFile();
      if (typeof window.showSaveFilePicker === "function") {
        const handle = await window.showSaveFilePicker({
          suggestedName: file.name,
          types: [{ description: "Backup do Orçamento Express", accept: { "application/json": [".json"] } }]
        });
        const writer = await handle.createWritable();
        await writer.write(file);
        await writer.close();
        markBackup();
        report("Arquivo salvo no destino escolhido.");
        return;
      }
      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        report("Confira se o arquivo apareceu na pasta escolhida na sua nuvem.");
        return;
      }
      report("Toque em Baixar arquivo e guarde a cópia no iCloud Drive, no Google Drive ou na nuvem que você usa.");
      return false;
    } catch (error) {
      if (error.name === "AbortError") return;
      report("Toque em Baixar arquivo e guarde a cópia no iCloud Drive, no Google Drive ou na nuvem que você usa.");
      return false;
    }
  }

  function connectBackupDialog(dialog) {
    connectBackupPrompt(dialog.querySelector("[data-cloud]"), dialog.querySelector("[data-download]"), dialog.querySelector('[role="status"]'));
    dialog.querySelector("[data-later]").onclick = () => dialog.close();
  }

  function connectBackupPrompt(cloud, download, status) {
    cloud.onclick = async () => {
      cloud.disabled = true;
      status.textContent = "";
      download.hidden = true;
      try {
        const result = await saveBackupToCloud(message => { status.textContent = message; });
        download.hidden = result !== false;
      }
      finally { cloud.disabled = false; }
    };
    download.onclick = () => {
      if (downloadBackup()) status.textContent = "Procure o arquivo em Downloads e envie uma cópia para a sua nuvem.";
    };
  }

  function createBackupShareButton(report) {
    if (typeof navigator.share !== "function") return null;
    const sample = new File(["{}"], "backup.json", { type: "application/json" });
    if (!navigator.canShare?.({ files: [sample] })) return null;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Compartilhar arquivo de backup";
    button.onclick = async () => {
      button.disabled = true;
      try {
        await navigator.share({ files: [backupFile()] });
        report("Confira se o arquivo apareceu na pasta escolhida na sua nuvem.");
      } catch (error) {
        if (error.name !== "AbortError") report("O compartilhamento falhou. Você pode baixar o arquivo e enviá-lo à sua nuvem pelo app Arquivos.");
      } finally { button.disabled = false; }
    };
    return button;
  }

  function showStorageIntro() {
    const key = "orc_aviso_armazenamento_v2";
    if (localStorage.getItem(key)) return;
    const dialog = document.createElement("dialog");
    dialog.id = "storageIntro";
    dialog.setAttribute("aria-labelledby", "storageIntroTitle");
    dialog.style.cssText = "width:min(92vw,420px);margin:auto;padding:20px;border:1px solid #F2EAF8;border-radius:16px;color:#5d527c";
    dialog.innerHTML = '<h2 id="storageIntroTitle">Onde ficam seus orçamentos</h2>' +
      '<p>Este app guarda seus dados no navegador deste aparelho, sem sincronização automática. Se você apagar os dados do site, usar outro navegador ou perder o aparelho, precisará de uma cópia para recuperar os registros.</p>' +
      '<p>Use as opções abaixo para guardar uma cópia. Depois de cadastrar seus dados, faça um novo backup.</p><p role="status"></p>' +
      '<div class="backup-actions"><button type="button" data-cloud>Guardar cópia na nuvem</button>' +
      '<button type="button" data-download hidden>Baixar arquivo</button><button type="button" data-later>Agora não</button></div>';
    connectBackupDialog(dialog);
    dialog.addEventListener("close", () => {
      try { localStorage.setItem(key, "1"); } finally { dialog.remove(); }
    });
    document.body.append(dialog);
    dialog.showModal();
  }
  function restoreBackup(){const f=$("backupArquivo")?.files?.[0];if(!f){alert("Escolha o arquivo de backup primeiro.");return;}const r=new FileReader();r.onload=()=>{try{const b=JSON.parse(r.result);if(b?.versao!==1||!Array.isArray(b.produtos)||!Array.isArray(b.orcamentos)||!b.dados||typeof b.dados!=="object"||Array.isArray(b.dados))throw Error("Backup inválido");if(!confirm("Restaurar este backup? Os dados atuais serão substituídos."))return;save(K.dados,b.dados||{});save(K.produtos,b.produtos||[]);save(K.orcamentos,b.orcamentos||[]);b.logo?localStorage.setItem(K.logo,b.logo):localStorage.removeItem(K.logo);if(b.senha)localStorage.setItem(K.senha,b.senha);alert("Backup restaurado. Feche e abra o app novamente para atualizar tudo.");}catch{alert("Arquivo de backup inválido.");}};r.readAsText(f);}

  const statuses = ["Rascunho", "Enviado", "Aprovado", "Recusado", "Cancelado"];
  const searchKey = value => String(value || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

  function budgetStatus(record) {
    if (statuses.includes(record.status)) return record.status;
    const old = { Aprovado: "Aprovado", "Não aprovado": "Recusado", Cancelado: "Cancelado" };
    return old[record.categoria] || (/^Enviado/i.test(record.status || "") ? "Enviado" : "Rascunho");
  }

  function legacyForm(record) {
    const text = record.texto || "";
    const line = label => text.split("\n").find(value => value.includes(label))?.split(label).slice(1).join(label).trim() || "";
    const date = value => /^\d{2}\/\d{2}\/\d{4}$/.test(value) ? value.split("/").reverse().join("-") : "";
    const freight = line("*Frete:*");
    const payment = line("*Pagamento:*");
    const type = ["Transportadora", "Correio", "Motoboy"].find(value => freight.startsWith(value)) || "Retirada";
    const items = Array.from(text.matchAll(/^[•-] (.+) — (\d+) un\. x R\$\s*([\d.,]+) = /gm), match => ({
      nome: match[1], qtd: Number(match[2]), valorUnit: pv(match[3])
    }));
    return {
      nomePersonalizado: line("*Nome para personalizar:*"), idadePersonalizada: line("*Idade para personalizar:*"),
      cliente: record.cliente, telefone: record.clienteWpp, tema: record.tema || line("*Tema:*"),
      dataFesta: date(line("*Data da festa:*")), dataEntrega: date(line("*Entrega:*")),
      validade: date(line("*Válido até:*")),
      obs: text.match(/\*Obs\.:\*\s*([\s\S]*?)(?=\n\n✨|$)/)?.[1].trim() || "",
      forma: payment, parc: line("Parcelamento:"), taxa: pv(line("Taxa do cartão:")),
      sinal: text.match(/Sinal \((\d+)%\)/)?.[1] || (text.includes("100% antecipado") ? "100" : "0"),
      restante: line("💵 Restante").split(" — ").pop(),
      tipoFrete: type, transpNome: freight.match(/^Transportadora \((.*?)\)/)?.[1] || "",
      freteValor: pv(freight.match(/R\$\s*([\d.,]+)/)?.[1]), itens: items
    };
  }

  function readHistory() {
    const records = JSON.parse(localStorage.getItem(K.orcamentos) || "[]");
    if (!Array.isArray(records)) throw new Error("Histórico inválido");
    return records;
  }

  function writeBudget(form, text, total, id) {
    try {
      const records = readHistory();
      const index = id ? records.findIndex(record => record.id === id) : -1;
      if (id && index < 0) throw new Error("Orçamento excluído");
      const previous = records[index];
      const now = new Date().toISOString();
      const record = {
        ...previous, id: id || crypto.randomUUID(), criadoEm: previous?.criadoEm || now, atualizadoEm: now,
        status: previous ? budgetStatus(previous) : "Rascunho",
        cliente: form.cliente, clienteWpp: form.telefone, tema: form.tema, totalTxt: fmt(total),
        texto: cleanPix(text), formulario: form
      };
      if (previous?.texto && !previous.formulario) record.textoOriginal = previous.texto;
      if (previous) records[index] = record;
      else records.unshift(record);
      save(K.orcamentos, records);
      return record;
    } catch {
      alert("Não foi possível gravar o orçamento. Os campos continuam preenchidos para você tentar novamente.");
      return null;
    }
  }

  function updateStatus(id, status) {
    try {
      const records = readHistory();
      const record = records.find(entry => entry.id === id);
      if (!record) throw new Error("Orçamento excluído");
      record.status = status;
      record.atualizadoEm = new Date().toISOString();
      save(K.orcamentos, records);
    } catch {
      alert("Não foi possível atualizar o status.");
    }
    renderHistory();
  }

  function transfer(record) {
    const form = record.formulario || legacyForm(record);
    if (!form.itens.length) return alert("Abra o orçamento, confira os itens e salve antes de copiar.");
    const payload = {
      tipo: "orcamento-express", versao: 1,
      cliente: form.cliente, telefone: form.telefone || "", tema: form.tema || "",
      dataFesta: form.dataFesta || "", dataEntrega: form.dataEntrega || "",
      entrega: form.tipoFrete || "", frete: Number(form.freteValor) || 0,
      observacoes: [form.nomePersonalizado ? "Nome para personalizar: " + form.nomePersonalizado : "", form.idadePersonalizada ? "Idade para personalizar: " + form.idadePersonalizada : "", form.obs, form.transpNome ? "Transportadora: " + form.transpNome : ""].filter(Boolean).join("\n"),
      itens: form.itens.map(item => ({ nome: item.nome, quantidade: item.qtd, preco: item.valorUnit }))
    };
    const destination = "https://pedidoemdia.mundodasideias.online/#importar-orcamento";
    $("pedidoTransferText").value = JSON.stringify(payload);
    const dialog = $("pedidoTransfer");
    if (!dialog.open) dialog.showModal();
    $("pedidoTransferLink").href = destination;
    $("pedidoTransferStatus").textContent = "Copie o texto e cole em Importar orçamento no Pedido em Dia.";
    $("pedidoTransferText").select();
    navigator.clipboard?.writeText($("pedidoTransferText").value).then(() => {
      $("pedidoTransferStatus").textContent = "Dados copiados. Abra o Pedido em Dia e cole em Importar orçamento.";
    }).catch(() => {});
  }

  function renderHistory() {
    const box = $("histList");
    if (!box) return;
    const query = searchKey($("histBusca")?.value);
    const records = json(K.orcamentos, []).filter(record =>
      [record.cliente, record.clienteWpp, record.tema, record.texto, record.categoria, budgetStatus(record)]
        .some(value => searchKey(value).includes(query))
    );
    box.replaceChildren();
    if (!records.length) {
      box.innerHTML = '<p class="hist-empty">Nenhum orçamento encontrado.</p>';
      return;
    }
    for (const record of records) {
      const form = record.formulario || legacyForm(record);
      const card = document.createElement("article");
      card.className = "hist-card";
      card.innerHTML = '<div class="hist-top"><strong class="hist-title"></strong><strong class="hist-total"></strong></div>' +
        '<p class="hist-meta"></p><label class="hist-cat">Status<select></select></label>' +
        '<div class="hist-actions"><button data-a="ver">Ver texto</button><button data-a="editar">Editar orçamento</button>' +
        '<button data-a="duplicar">Duplicar</button><button data-a="transferir">Copiar para o Pedido em Dia</button>' +
        '<button data-a="copiar">Copiar texto</button><button data-a="whats">Abrir WhatsApp</button>' +
        '<button class="danger" data-a="excluir">Excluir</button></div><p class="hist-text"></p>';
      card.querySelector(".hist-title").textContent = record.cliente || "Cliente sem nome";
      card.querySelector(".hist-total").textContent = record.totalTxt || "";
      card.querySelector(".hist-meta").textContent = [
        record.tema, record.clienteWpp, dataBR(record.criadoEm),
        form.validade ? "Válido até " + form.validade.split("-").reverse().join("/") : ""
      ].filter(Boolean).join(" · ");
      const select = card.querySelector("select");
      for (const status of statuses) select.add(new Option(status, status));
      select.value = budgetStatus(record);
      select.onchange = () => updateStatus(record.id, select.value);
      const preview = card.querySelector(".hist-text");
      preview.textContent = cleanPix(record.texto);
      const action = (name, handler) => card.querySelector('[data-a="' + name + '"]').onclick = handler;
      action("ver", () => preview.style.display = preview.style.display === "block" ? "none" : "block");
      action("editar", () => openBudgetForm(form, record.id));
      action("duplicar", () => openBudgetForm(form, null));
      action("transferir", () => transfer(record));
      action("copiar", async () => {
        try {
          await navigator.clipboard.writeText(preview.textContent);
          alert("Orçamento copiado.");
        } catch {
          preview.style.display = "block";
        }
      });
      action("whats", () => OrcamentoWhatsApp.open(preview.textContent, record.clienteWpp));
      action("excluir", () => {
        if (!confirm("Excluir este orçamento do histórico?")) return;
        try {
          save(K.orcamentos, readHistory().filter(entry => entry.id !== record.id));
          renderHistory();
        } catch {
          alert("Não foi possível excluir o orçamento.");
        }
      });
      box.append(card);
    }
  }
  function clearHistory(){if(!confirm("Apagar todos os orçamentos salvos? Faça backup antes se quiser guardar."))return;localStorage.removeItem(K.orcamentos);renderHistory();alert("Histórico apagado.");}

  function hooks() {
    $("btnSalvarProduto")?.addEventListener("click", renderProducts);
    connectBackupPrompt($("btnBackupSalvo"), $("btnBackupDownloadSalvo"), $("backupStatusSalvo"));
    const share = createBackupShareButton(alert);
    if (share) $("btnBackupCloud").after(share);
    $("btnTransferir").onclick = () => { if (ultimoOrcamento?.registro) transfer(ultimoOrcamento.registro); };
  }
  window.OrcamentoHistorico = { writeBudget, renderHistory, showSavedBackupReminder };
  function init(){style();ensureProductsTab();ensureHistoryTab();ensurePix();ensureBackup();hooks();renderHistory();checkBackup();setupTabMemory();showStorageIntro();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
