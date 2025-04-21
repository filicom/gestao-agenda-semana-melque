// Seleção de elementos
const frm = document.querySelector("form");
const agendaSection = document.querySelector('.agendas-semana');
const registroSection = document.querySelector('.registro-agendas');
const openRegistroBtn = document.getElementById('open-registro');
const backAgendaBtn = document.querySelector('.back-agenda');
const agendasDiv = document.querySelector('.agendas'); // Container onde os registros serão adicionados
const valorTotal = document.getElementById('valor-total');

let registros = []; // Array para armazenar os registros

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
});

// Volta para a agenda semanal
backAgendaBtn.addEventListener('click', () => {
    registroSection.classList.remove('active');
    agendaSection.classList.add('active');
});

// Função para formatar a data como dia/mês/ano
const formatarData = (data) => {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
};

// Submissão do formulário
frm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Captura os valores do formulário
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

    // Adiciona o registro ao array de registros
    registros.push({ nome, contato, orcamento, endereco, servico, data });

    // Ordena os registros pela data mais próxima
    registros.sort((a, b) => new Date(a.data) - new Date(b.data));

    // Salva no localStorage
    salvarRegistros();

    // Atualiza a exibição dos registros na agenda
    atualizarAgenda();

    // Limpa os campos e exibe mensagem de sucesso
    limparCampos();
    menssagemEnviado();
});

// Função para limpar os campos do formulário
const limparCampos = () => {
    frm.nome.value = "";
    frm.contato.value = "";
    frm.orcamento.value = "";
    frm.endereco.value = "";
    frm.servico.value = "";
    frm.data.value = "";
    frm.nome.focus();
};

// Função para exibir mensagem de sucesso
const menssagemEnviado = () => {
    alert("Registro cadastrado com sucesso!");
};

// Função para salvar os registros no localStorage
const salvarRegistros = () => {
    localStorage.setItem("registros", JSON.stringify(registros));
};

// Função para excluir um registro
const excluirRegistro = (index) => {
    if (confirm("Tem certeza que deseja concluir este serviço?")) {
        registros.splice(index, 1); // Remove o registro do array
        salvarRegistros(); // Atualiza o localStorage
        atualizarAgenda(); // Atualiza a exibição
    }
};

// Função para atualizar a agenda
const atualizarAgenda = () => {
    agendasDiv.innerHTML = ""; // Limpa o container antes de adicionar os registros

    registros.forEach((registro, index) => {
        const registroDiv = document.createElement("div");
        registroDiv.classList.add("registro-item"); // Classe para estilização

        registroDiv.innerHTML = `
            <p><strong>Nome:</strong> ${registro.nome}</p>
            <p><strong>Contato:</strong> ${registro.contato}</p>
            <p><strong>Serviço:</strong> ${registro.servico}</p>
            <p><strong>Endereço:</strong> ${registro.endereco}</p>
            <p><strong>Orçamento:</strong> R$ ${registro.orcamento.toFixed(2)}</p>
            <p><strong>Data:</strong> ${formatarData(registro.data)}</p>
            <button class="btn-excluir" onclick="excluirRegistro(${index})">Concluir</button>
        `;

        agendasDiv.appendChild(registroDiv); // Adiciona o registro na agenda
    });
};
