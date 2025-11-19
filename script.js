// Seleção de elementos
const frm = document.querySelector("form");
const agendaSection = document.querySelector('.agendas-semana');
const registroSection = document.querySelector('.registro-agendas');
const openRegistroBtn = document.getElementById('open-registro');
const backAgendaBtn = document.querySelector('.back-agenda');
const agendasDiv = document.querySelector('.agendas');
const valorTotal = document.getElementById('valor-total');
const openHistoricoBtn = document.getElementById('open-historico');
const historicoSection = document.querySelector('.historico-agendas');
const historicoListDiv = document.querySelector('.historico-list');
const closeHistoricoBtn = document.getElementById('close-historico');
const exportHistoricoBtn = document.getElementById('export-historico');
const toggleSortBtn = document.getElementById('toggle-sort');
const historicoCountSpan = document.getElementById('historico-count');
const historicoTotalSpan = document.getElementById('historico-total');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');
const filterNameInput = document.getElementById('filter-name');

let registros = [];
// Histórico de serviços concluídos
// localStorage keys:
// - 'registros' -> array de registros ativos
// - 'historico' -> array de registros concluídos (cada item possui 'concluidoEm' ISO)
let historico = [];
// ordenação de exibição: false = mais recentes primeiro (padrão atual), true = mais antigos primeiro
let historicoSortAsc = false;
// filtros aplicados (estado)
let historicoFilters = { name: '' };

// Formatação de moeda (pt-BR) — produz número formatado e adiciona sufixo ' R$'
const formatarMoeda = (num) => {
    if (num == null || num === '') return '';
    const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(num));
    return `${formatted} R$`;
};

// Carrega os registros do localStorage ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    const registrosSalvos = localStorage.getItem("registros");
    if (registrosSalvos) {
        registros = JSON.parse(registrosSalvos);
        atualizarAgenda();
    }
    const historicoSalvo = localStorage.getItem('historico');
    if (historicoSalvo) {
        historico = JSON.parse(historicoSalvo);
    }
    // atualiza a UI do histórico se estiver visível
    atualizarHistorico();
    // conecta eventos de filtro (apenas por nome)
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', () => {
        historicoFilters.name = filterNameInput.value.trim();
        atualizarHistorico();
    });
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => {
        filterNameInput.value = '';
        historicoFilters = { name: '' };
        atualizarHistorico();
    });
});

// Alterna para o registro de agenda
openRegistroBtn.addEventListener('click', () => {
    agendaSection.classList.remove('active');
    registroSection.classList.add('active');
    carregarFormularioTemporario(); // Carrega os dados do formulário, se houver
});

// Volta para a agenda semanal - attach to all elements with class 'back-agenda'
document.querySelectorAll('.back-agenda').forEach(btn => {
    btn.addEventListener('click', () => {
        // garante que qualquer painel de input seja fechado e a agenda principal seja mostrada
        registroSection.classList.remove('active');
        historicoSection && historicoSection.classList.remove('active');
        agendaSection.classList.add('active');
    });
});

// Abrir/fechar histórico
openHistoricoBtn.addEventListener('click', () => {
    agendaSection.classList.remove('active');
    historicoSection.classList.add('active');
    atualizarHistorico();
});

closeHistoricoBtn.addEventListener('click', () => {
    historicoSection.classList.remove('active');
    agendaSection.classList.add('active');
});

// Exporta o histórico para CSV (botão removido da UI; apenas registra o handler se existir)
if (exportHistoricoBtn) {
    exportHistoricoBtn.addEventListener('click', () => {
        const listaExport = getFilteredHistorico();
        if (!listaExport.length) return alert('Nenhum item no histórico para exportar com os filtros atuais.');
        const rows = [ ['Nome','Contato','Serviço','Endereço','Orçamento','Data do serviço','Concluído em'] ];
        listaExport.forEach(item => {
            rows.push([
                item.nome || '',
                item.contato || '',
                item.servico || '',
                item.endereco || '',
                (item.orcamento != null) ? Number(item.orcamento).toFixed(2) : '',
                item.data ? formatarData(item.data) : '',
                item.concluidoEm ? formatarDataHora(item.concluidoEm) : ''
            ]);
        });
        const csvContent = rows.map(r => r.map(cell => '"' + String(cell).replace(/"/g,'""') + '"').join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const time = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
        a.download = `historico-melque-${time}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });
}

// Alterna a ordenação exibida (botão removido da UI — só conecta se existir)
if (toggleSortBtn) {
    toggleSortBtn.addEventListener('click', () => {
        historicoSortAsc = !historicoSortAsc;
        toggleSortBtn.textContent = historicoSortAsc ? 'Ordenar: Mais antigos' : 'Ordenar: Mais recentes';
        atualizarHistorico();
    });
}

// Confirmações: solicita confirmação ao concluir ou remover itens.

// Formata a data para DD/MM/AAAA
const formatarData = (data) => {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
};

// Submissão do formulário
frm.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = frm.nome.value;
    const contato = frm.contato.value;
    const endereco = frm.endereco.value;
    // parse orcamento from masked input (digits -> cents)
    const rawOrc = (frm.orcamento.value || '').replace(/\D/g,'');
    const orcamento = rawOrc ? Number(rawOrc)/100 : 0;
    const servico = frm.servico.value;
    const data = frm.data.value;

    if (!data) {
        alert("A data é obrigatória!");
        return;
    }

    registros.push({ nome, contato, orcamento, endereco, servico, data });

    registros.sort((a, b) => new Date(a.data) - new Date(b.data));

    salvarRegistros();
    atualizarAgenda();
    limparCampos();
    menssagemEnviado();
});

// Salva os dados do formulário enquanto digita
const campos = frm.querySelectorAll("input, select");
campos.forEach(campo => {
    campo.addEventListener("input", () => {
        const dadosForm = {
            nome: frm.nome.value,
            contato: frm.contato.value,
            endereco: frm.endereco.value,
            orcamento: frm.orcamento.value,
            servico: frm.servico.value,
            data: frm.data.value
        };
        localStorage.setItem("formTemp", JSON.stringify(dadosForm));
    });
});

// Máscara para o campo de telefone: (DD) 00000-0000
const contatoInput = document.getElementById('contato');
const formatarTelefone = (value) => {
    if (!value) return '';
    // remove tudo que não for dígito
    const nums = value.replace(/\D/g, '').slice(0, 11); // DDD(2) + 9 dígitos = 11
    const ddd = nums.slice(0, 2);
    const parte1 = nums.slice(2, 7); // 5 dígitos
    const parte2 = nums.slice(7, 11); // 4 dígitos
    if (!ddd) return '';
    if (!parte1) return `(${ddd}`;
    if (!parte2) return `(${ddd}) ${parte1}`;
    return `(${ddd}) ${parte1}-${parte2}`;
};

const aplicarMascaraTelefone = (e) => {
    const el = e.target;
    const raw = el.value;
    // posição anterior do caret (índice no valor bruto)
    const start = el.selectionStart || 0;
    // quantos dígitos havia antes do caret
    const digitsBeforeCaret = (raw.slice(0, start).match(/\d/g) || []).length;

    const formatted = formatarTelefone(raw);
    el.value = formatted;

    // agora posiciona o caret após a mesma quantidade de dígitos
    if (digitsBeforeCaret === 0) {
        el.selectionStart = el.selectionEnd = formatted.indexOf('(') >= 0 ? formatted.indexOf('(') + 1 : 0;
        return;
    }
    let digitsSeen = 0;
    let caretPos = formatted.length;
    for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) digitsSeen++;
        if (digitsSeen >= digitsBeforeCaret) { caretPos = i + 1; break; }
    }
    el.selectionStart = el.selectionEnd = caretPos;
};

if (contatoInput) {
    contatoInput.addEventListener('input', aplicarMascaraTelefone);
}

// Máscara para o campo de orçamento: permite dígitos, ponto e vírgula; adiciona sufixo ' R$'
const orcamentoInput = document.getElementById('orcamento');
const aplicarMascaraMoeda = (e) => {
    const el = e.target;
    const raw = el.value;
    const start = el.selectionStart || 0;
    // remove sufixo se presente
    let v = raw.endsWith(' R$') ? raw.slice(0, -3) : raw;
    // permite apenas dígitos, ponto e vírgula
    v = v.replace(/[^\d.,]/g, '');
    if (!v) { el.value = ''; return; }
    el.value = v + ' R$';
    // posiciona caret antes do sufixo
    const pos = Math.min(v.length, start);
    el.selectionStart = el.selectionEnd = pos;
};
if (orcamentoInput) {
    orcamentoInput.addEventListener('input', aplicarMascaraMoeda);
}

// Carrega dados temporários do formulário
const carregarFormularioTemporario = () => {
    const dadosSalvos = localStorage.getItem("formTemp");
    if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos);
        frm.nome.value = dados.nome || "";
        frm.contato.value = dados.contato ? formatarTelefone(dados.contato) : "";
        frm.endereco.value = dados.endereco || "";
        // se orcamento salvo for numérico, formata como moeda; se for string com máscara, mantém
        if (dados.orcamento == null) {
            frm.orcamento.value = "";
        } else if (!isNaN(Number(dados.orcamento))) {
            frm.orcamento.value = formatarMoeda(Number(dados.orcamento));
        } else {
            frm.orcamento.value = dados.orcamento || "";
        }
        frm.servico.value = dados.servico || "";
        frm.data.value = dados.data || "";
    }
};

// Limpa o formulário e remove dados temporários
const limparCampos = () => {
    frm.nome.value = "";
    frm.contato.value = "";
    frm.orcamento.value = "";
    frm.endereco.value = "";
    frm.servico.value = "";
    frm.data.value = "";
    frm.nome.focus();
    localStorage.removeItem("formTemp");
};

// Mensagem de sucesso
const menssagemEnviado = () => {
    alert("Registro cadastrado com sucesso!");
};

// Salva os registros no localStorage
const salvarRegistros = () => {
    localStorage.setItem("registros", JSON.stringify(registros));
};

// Exclui um registro e atualiza a agenda
const excluirRegistro = (index) => {
    // pede confirmação antes de marcar como concluído
    if (!confirm('Tem certeza que deseja marcar este serviço como concluído?')) return;
    const concluido = Object.assign({}, registros[index]);
    concluido.concluidoEm = new Date().toISOString();
    historico.unshift(concluido);
    registros.splice(index, 1);
    salvarRegistros();
    salvarHistorico();
    atualizarAgenda();
    atualizarHistorico();
};

// Remove item do histórico pelo índice
const removerHistorico = (index) => {
    // confirmação antes de remover do histórico
    if (!confirm('Tem certeza que deseja remover este item do histórico?')) return;
    historico.splice(index, 1);
    salvarHistorico();
    atualizarHistorico();
};

// Atualiza a exibição da agenda e valor total
const atualizarAgenda = () => {
    agendasDiv.innerHTML = "";

    let total = 0;

    registros.forEach((registro, index) => {
        const registroDiv = document.createElement("div");
        registroDiv.classList.add("registro-item");
        // Monta o conteúdo do registro com elementos (sem usar onclick inline)
        const fields = [
            ['Nome', registro.nome],
            ['Contato', registro.contato],
            ['Serviço', registro.servico],
            ['Endereço', registro.endereco],
            ['Orçamento', formatarMoeda(registro.orcamento)],
            ['Data', formatarData(registro.data)]
        ];
        fields.forEach(([label, val]) => {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${label}:</strong> ${val || ''}`;
            registroDiv.appendChild(p);
        });

        const actions = document.createElement('div');
        actions.classList.add('action-buttons');

    const concluirBtn = document.createElement('button');
    concluirBtn.className = 'btn-excluir';
    concluirBtn.type = 'button';
    concluirBtn.textContent = 'Concluir';
    concluirBtn.addEventListener('click', () => excluirRegistro(index));

    actions.appendChild(concluirBtn);
        registroDiv.appendChild(actions);

        agendasDiv.appendChild(registroDiv);
        total += registro.orcamento;
    });

    valorTotal.textContent = `Valor total da semana: R$ ${total.toFixed(2)}`;
};

// Salva histórico no localStorage
const salvarHistorico = () => {
    localStorage.setItem('historico', JSON.stringify(historico));
};

// Atualiza a exibição do histórico
const formatarDataHora = (iso) => {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const atualizarHistorico = () => {
    if (!historicoListDiv) return;
    historicoListDiv.innerHTML = '';
    if (historico.length === 0) {
        historicoListDiv.innerHTML = '<p>Nenhum serviço foi concluído ainda.</p>';
        if (historicoCountSpan) historicoCountSpan.textContent = '0 itens';
        if (historicoTotalSpan) historicoTotalSpan.textContent = 'Total concluídos: R$ 0,00';
        if (exportHistoricoBtn) exportHistoricoBtn.disabled = true;
        return;
    }
    // preparar lista exibida respeitando ordenação escolhida e filtros
    const listaBase = getFilteredHistorico();
    const lista = [...listaBase];
    lista.sort((a,b) => {
        const ta = a.concluidoEm ? new Date(a.concluidoEm).getTime() : 0;
        const tb = b.concluidoEm ? new Date(b.concluidoEm).getTime() : 0;
        return historicoSortAsc ? ta - tb : tb - ta;
    });

    if (historicoCountSpan) {
        historicoCountSpan.textContent = `${listaBase.length} de ${historico.length} item${historico.length>1? 's':''}`;
    }

    // habilita/desabilita botões conforme filtros / conteúdo
    if (exportHistoricoBtn) exportHistoricoBtn.disabled = (listaBase.length === 0);

    // soma total dos orçamentos dos itens exibidos no histórico (respeita filtros)
    const totalConcluidos = listaBase.reduce((sum, it) => sum + (Number(it.orcamento) || 0), 0);
    if (historicoTotalSpan) historicoTotalSpan.textContent = `Total concluídos: ${formatarMoeda(totalConcluidos)}`;

    lista.forEach((item, idx) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('registro-item');

        // Apenas exibe campos quando possuem valor (evita linhas vazias/icons redundantes)
        const fields = [
                ['Nome', item.nome],
                ['Serviço', item.servico],
                ['Orçamento', (item.orcamento != null && item.orcamento !== 0) ? formatarMoeda(item.orcamento) : ''],
                ['Concluído em', item.concluidoEm ? formatarDataHora(item.concluidoEm) : '']
            ];
            fields.forEach(([label, val]) => {
                if (!val) return; // pula campos sem valor
                const p = document.createElement('p');
                p.innerHTML = `<strong>${label}:</strong> ${val}`;
                itemDiv.appendChild(p);
            });

        const actions = document.createElement('div');
        actions.classList.add('action-buttons');

    const removerBtn = document.createElement('button');
    removerBtn.className = 'btn-excluir';
    removerBtn.type = 'button';
    removerBtn.textContent = 'Remover';
    removerBtn.addEventListener('click', () => removerHistorico(idx));

    actions.appendChild(removerBtn);
        itemDiv.appendChild(actions);

        historicoListDiv.appendChild(itemDiv);
    });
};

// Retorna o historico filtrado de acordo com historicoFilters
const getFilteredHistorico = () => {
    return historico.filter(item => {
        // filtro por nome
        if (historicoFilters.name) {
            const name = (item.nome || '').toLowerCase();
            if (!name.includes(historicoFilters.name.toLowerCase())) return false;
        }
        // (sem filtros de data — apenas filtro por nome permanece)
        return true;
    });
};

// Map functionality removed as requested (map modal and geocoding removed).

// Não expomos mais funções globalmente: usamos event listeners quando criamos os botões.
