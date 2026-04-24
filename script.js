// Seleção de elementos
const frm = document.querySelector("form");
const agendaSection = document.querySelector('.agendas-semana');
const registroSection = document.querySelector('.registro-agendas');
const historicoSection = document.querySelector('.historico-agendas');

const openRegistroBtn = document.getElementById('open-registro');
const openHistoricoBtn = document.getElementById('open-historico');

const agendasDiv = document.querySelector('.agendas');
const valorTotal = document.getElementById('valor-total');

const historicoListDiv = document.querySelector('.historico-list');
const historicoCountSpan = document.getElementById('historico-count');
const historicoTotalSpan = document.getElementById('historico-total');

// Dados
let registros = JSON.parse(localStorage.getItem("registros")) || [];
let historico = JSON.parse(localStorage.getItem("historico")) || [];

// 🔔 Notificação
if ("Notification" in window) {
    Notification.requestPermission();
}

// 💰 Formatação
const formatarMoeda = (num) =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(num) + " R$";

const formatarData = (data) => {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
};

// 💾 Salvar
const salvar = () => {
    localStorage.setItem("registros", JSON.stringify(registros));
    localStorage.setItem("historico", JSON.stringify(historico));
};

// 📊 Dashboard
const atualizarResumo = (total) => {
    const hoje = new Date().toISOString().split("T")[0];
    const hojeServicos = registros.filter(r => r.data === hoje).length;

    valorTotal.innerHTML = `
        💰 Total: R$ ${total.toFixed(2)} <br>
        📋 Serviços: ${registros.length} | 📅 Hoje: ${hojeServicos}
    `;
};

// 📍 Maps
const abrirMaps = (endereco) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
    window.open(url, '_blank');
};

// 📅 Atualizar agenda
const atualizarAgenda = () => {
    agendasDiv.innerHTML = "";
    let total = 0;
    const hoje = new Date().toISOString().split("T")[0];

    registros.forEach((r, i) => {
        const div = document.createElement("div");
        div.classList.add("registro-item");

        // Status visual
        if (r.data === hoje) {
            div.style.borderLeft = "5px solid orange";
        } else if (r.data < hoje) {
            div.style.borderLeft = "5px solid red";
        } else {
            div.style.borderLeft = "5px solid green";
        }

        div.innerHTML = `
            <p><strong>Nome:</strong> ${r.nome}</p>
            <p><strong>Serviço:</strong> ${r.servico}</p>
            <p><strong>Endereço:</strong> ${r.endereco}</p>
            <p><strong>Data:</strong> ${formatarData(r.data)}</p>
            <p><strong>Orçamento:</strong> ${formatarMoeda(r.orcamento)}</p>
        `;

        const actions = document.createElement("div");
        actions.classList.add("action-buttons");

        // Concluir
        const concluir = document.createElement("button");
        concluir.textContent = "Concluir";
        concluir.onclick = () => {
            const item = { ...r, concluidoEm: new Date().toISOString() };

            historico.unshift(item);
            registros.splice(i, 1);

            salvar();
            atualizarAgenda();
            atualizarHistorico(); // 🔥 importante
        };

        // Maps
        const maps = document.createElement("button");
        maps.textContent = "Maps";
        maps.onclick = () => abrirMaps(r.endereco);

        actions.appendChild(concluir);
        actions.appendChild(maps);
        div.appendChild(actions);

        agendasDiv.appendChild(div);
        total += r.orcamento;

        // Notificação
        if (Notification.permission === "granted" && r.data === hoje) {
            new Notification("Serviço hoje!", {
                body: `${r.nome} - ${r.servico}`
            });
        }
    });

    atualizarResumo(total);
};

// 📝 Formulário
frm.addEventListener("submit", (e) => {
    e.preventDefault();

    const raw = frm.orcamento.value.replace(/\D/g, '');
    const valor = raw ? Number(raw) / 100 : 0;

    registros.push({
        nome: frm.nome.value,
        contato: frm.contato.value,
        endereco: frm.endereco.value,
        servico: frm.servico.value,
        data: frm.data.value,
        orcamento: valor
    });

    registros.sort((a, b) => new Date(a.data) - new Date(b.data));

    salvar();
    atualizarAgenda();
    frm.reset();
});

// 🔄 Navegação
openRegistroBtn.addEventListener('click', () => {
    agendaSection.classList.remove('active');
    registroSection.classList.add('active');
});

document.querySelectorAll('.back-agenda').forEach(btn => {
    btn.addEventListener('click', () => {
        registroSection.classList.remove('active');
        historicoSection.classList.remove('active');
        agendaSection.classList.add('active');
    });
});

// Abrir histórico
openHistoricoBtn.addEventListener('click', () => {
    agendaSection.classList.remove('active');
    registroSection.classList.remove('active');
    historicoSection.classList.add('active');

    atualizarHistorico(); // 🔥 ESSENCIAL
});

// 📜 Atualizar histórico
const atualizarHistorico = () => {
    historicoListDiv.innerHTML = '';

    const quantidade = historico.length;

    const total = historico.reduce((soma, item) => {
        return soma + (Number(item.orcamento) || 0);
    }, 0);

    historicoCountSpan.textContent = `${quantidade} item${quantidade !== 1 ? 's' : ''}`;
    historicoTotalSpan.textContent = `Total concluídos: ${formatarMoeda(total)}`;

    if (quantidade === 0) {
        historicoListDiv.innerHTML = '<p>Nenhum serviço concluído.</p>';
        return;
    }

    historico.forEach((item, index) => {
        const div = document.createElement('div');
        div.classList.add('registro-item');

        div.innerHTML = `
            <p><strong>Nome:</strong> ${item.nome}</p>
            <p><strong>Serviço:</strong> ${item.servico}</p>
            <p><strong>Orçamento:</strong> ${formatarMoeda(item.orcamento)}</p>
            <p><strong>Concluído em:</strong> ${new Date(item.concluidoEm).toLocaleString()}</p>
        `;

        const btn = document.createElement('button');
        btn.textContent = '✖';
        btn.classList.add('btn-excluir');

        btn.onclick = () => removerHistorico(index);

        div.appendChild(btn);
        historicoListDiv.appendChild(div);
    });
};

// ❌ Remover do histórico
const removerHistorico = (index) => {
    if (!confirm("Deseja remover este item do histórico?")) return;

    historico.splice(index, 1);
    salvar();
    atualizarHistorico();
};

// 🚀 Inicialização
document.addEventListener("DOMContentLoaded", atualizarAgenda);