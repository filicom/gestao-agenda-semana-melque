// Seleção de elementos
const frm = document.querySelector("form");
const agendaSection = document.querySelector('.agendas-semana');
const registroSection = document.querySelector('.registro-agendas');
const openRegistroBtn = document.getElementById('open-registro');
const backAgendaBtn = document.querySelector('.back-agenda');
const agendasDiv = document.querySelector('.agendas');
const valorTotal = document.getElementById('valor-total');

let registros = [];

// Carrega os registros do localStorage ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    const registrosSalvos = localStorage.getItem("registros");
    if (registrosSalvos) {
        registros = JSON.parse(registrosSalvos);
        atualizarAgenda();
    }
});

// Alterna para o registro de agenda
openRegistroBtn.addEventListener('click', () => {
    agendaSection.classList.remove('active');
    registroSection.classList.add('active');
    carregarFormularioTemporario(); // Carrega os dados do formulário, se houver
});

// Volta para a agenda semanal
backAgendaBtn.addEventListener('click', () => {
    registroSection.classList.remove('active');
    agendaSection.classList.add('active');
});

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
    const orcamento = Number(frm.orcamento.value);
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

// Carrega dados temporários do formulário
const carregarFormularioTemporario = () => {
    const dadosSalvos = localStorage.getItem("formTemp");
    if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos);
        frm.nome.value = dados.nome || "";
        frm.contato.value = dados.contato || "";
        frm.endereco.value = dados.endereco || "";
        frm.orcamento.value = dados.orcamento || "";
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
    if (confirm("Tem certeza que deseja concluir este serviço?")) {
        registros.splice(index, 1);
        salvarRegistros();
        atualizarAgenda();
    }
};

// Atualiza a exibição da agenda e valor total
const atualizarAgenda = () => {
    agendasDiv.innerHTML = "";

    let total = 0;

    registros.forEach((registro, index) => {
        const registroDiv = document.createElement("div");
        registroDiv.classList.add("registro-item");

        registroDiv.innerHTML = `
            <p><strong>Nome:</strong> ${registro.nome}</p>
            <p><strong>Contato:</strong> ${registro.contato}</p>
            <p><strong>Serviço:</strong> ${registro.servico}</p>
            <p><strong>Endereço:</strong> ${registro.endereco}</p>
            <p><strong>Orçamento:</strong> R$ ${registro.orcamento.toFixed(2)}</p>
            <p><strong>Data:</strong> ${formatarData(registro.data)}</p>
            <button class="btn-excluir" onclick="excluirRegistro(${index})">Concluir</button>
        `;

        agendasDiv.appendChild(registroDiv);
        total += registro.orcamento;
    });

    valorTotal.textContent = `Valor total da semana: R$ ${total.toFixed(2)}`;
};
