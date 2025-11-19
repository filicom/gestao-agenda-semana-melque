Gestão Semanal — MelqueClean

Resumo curto
Uma aplicação front-end simples para gerenciar a agenda semanal da MelqueClean. Permite cadastrar serviços (cliente, contato, endereço, serviço, orçamento e data), marcar serviços como concluídos e manter um histórico local com filtros e exportação.

Funcionalidades principais
- Cadastrar novo serviço com: Nome, Contato, Endereço, Serviço, Orçamento e Data.
- Visualizar a agenda semanal com o valor total acumulado.
- Marcar um serviço como "Concluído" — o item é removido da agenda ativa e salvo no histórico local.
- Histórico de serviços concluídos:
  - Exibe contagem de itens e horário de conclusão.
  - Pesquisa por nome e filtro por intervalo de datas.
  - Exportar histórico (CSV) respeitando os filtros aplicados.
  - Alternar ordenação (mais recentes / mais antigos).
  - Limpar histórico (ação imediata).

Detalhes de UX e validações
- Máscara de telefone: o campo `Contato` usa o formato (DD) 00000-0000 enquanto digita.
- Máscara de orçamento: campo `Orçamento` permite dígitos, ponto e vírgula; ao final do valor é exibido o sufixo ` R$` (ex.: `1234,56 R$`). No envio o valor é convertido para número em reais (ex.: `1234.56`).
- Confirmações: ações de concluir/remover/limpar são executadas imediatamente (sem modal de confirmação), conforme solicitado.

Armazenamento (local)
- `localStorage` keys:
  - `registros` — lista de registros ativos (agenda)
  - `historico` — lista de registros concluídos (cada item contém `concluidoEm` timestamp)

Como testar localmente
1. Abra `index.html` no navegador (PowerShell):

```powershell
Start-Process 'c:\Users\Felip\Desktop\Desenvolvimento Solftware\Melque-Clean\gestao-semanal\index.html'
```

2. Clique em "Registrar agenda" e preencha o formulário. No campo "Orçamento" você pode digitar números e vírgula (ex.: `1234,56`); o sufixo ` R$` será adicionado automaticamente.
3. Volte para a agenda; use "Concluir" para mover o item ao histórico.
4. Abra "Ver histórico" para filtrar, exportar ou limpar o histórico.

Notas técnicas
- Exportação CSV usa valores numéricos (ponto decimal) para facilitar importação em planilhas.
- Não há confirmação modal — ações são imediatas. Se preferir, posso reintroduzir confirmação ou um pequeno modal de aviso.

Próximos passos sugeridos
- Adicionar validação mais forte no endereço e no orçamento (valor mínimo, formato). 
- Adicionar modal de edição de registro.
- Adicionar testes automatizados (Playwright/Puppeteer) para o fluxo principal.

Diga qual melhoria prefere que eu implemente a seguir.