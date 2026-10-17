<!-- l10n-sync: source-file="README.md" -->
🌐 [English](README.md) | [Español](README.es.md) | Português (Brasil) | [한국어](README.ko.md)

# 🎮 Mona Mayhem

**Workshop de VS Code e GitHub Copilot CLI** — Construa uma Arena de Batalha de Contribuições GitHub

Um template de workshop para construir, com Astro, um site com tema de arcade retrô que compara os gráficos de contribuição GitHub de dois usuários. Este é o **ponto de partida** — você vai construir o app passo a passo usando o GitHub Copilot.

![Mona Mayhem Screenshot](https://github.com/user-attachments/assets/5eca79e2-cb9f-4e93-aa0d-23666ebde3b7)
*O que você vai construir até o final do workshop*

## 📚 Workshop

O workshop oferece duas trilhas — siga a que corresponde ao seu fluxo de trabalho preferido:

- **Trilha VS Code** — Chat, Plan Mode, Agent Mode, agentes em segundo plano e ciclos de revisão nativos do editor
- **Trilha CLI** — `copilot`, contexto com `@file`, `/plan`, edições autônomas, `/fleet`, `/delegate` e `/review`

| Parte | Título | Foco no Copilot |
|-------|--------|-----------------|
| [00](workshop/pt_BR/00-overview.md) | Visão Geral | Escolha da trilha e objetivos de aprendizado |
| [01](workshop/pt_BR/01-setup.md) | Configuração & Engenharia de Contexto | Instruções, permissões e configuração do ambiente |
| [02](workshop/pt_BR/02-plan-and-scaffold.md) | Planejar & Estruturar | Planejamento da API e da arquitetura das páginas |
| [03](workshop/pt_BR/03-agent-mode.md) | Construir o Jogo | Implementação agentic e iteração |
| [04](workshop/pt_BR/04-design-vibes.md) | Temas Design-First | Planejamento e implementação do design visual |
| [05](workshop/pt_BR/05-polish.md) | Polimento & Trabalho Paralelo | Paralelismo, revisões e passes de qualidade |
| [06](workshop/pt_BR/06-bonus.md) | Bônus & Extensões | Ideias de funcionalidades abertas e experimentos extras com o Copilot |

## 🚀 Início Rápido

1. **Crie primeiro o seu próprio repositório**, de uma destas formas:
   - clicando em **Use this template** para criar um novo repositório, ou
   - fazendo fork deste repositório.
2. Escolha o seu caminho no workshop:
   - **VS Code:** clone o seu repositório e abra-o no VS Code.
   - **GitHub Copilot CLI:** clone o seu repositório localmente, instale o `copilot` e trabalhe a partir do terminal.
3. Siga o [guia do workshop](workshop/pt_BR/00-overview.md)

## Pré-requisitos

### Comuns

- GitHub Copilot (Pro, Business ou Enterprise)
- Git
- Node.js

### Trilha VS Code

- VS Code v1.107+
- Extensão GitHub Copilot com login realizado

### Trilha CLI

- GitHub Copilot CLI (`copilot`)
- Node.js 22+ se você pretende instalar o CLI via `npm install -g @github/copilot`
- Ou Homebrew / WinGet, se preferir instalar com um gerenciador de pacotes nativo

## Stack Tecnológica

- **Framework**: [Astro](https://astro.build/) v6
- **Runtime**: Node.js com adaptador [@astrojs/node](https://docs.astro.build/en/guides/integrations-guide/node/)
- **Fonte**: Press Start 2P (fonte de jogos retrô)
- **API**: API de gráfico de contribuições do GitHub

## Busca de Jogadores e Aparência

Os dois campos de jogador sugerem até cinco nomes de usuário do GitHub após dois
caracteres. Use as setas para cima/baixo e Enter, ou clique em uma sugestão. As
buscas têm debounce e os resultados recentes ficam em cache por um minuto. Se a
busca do GitHub estiver indisponível ou com limite de taxa, digitar o nome de
usuário completo continua funcionando.

Em **Settings**, escolha Blue, Red, Purple, Green, Amber ou Graphite, ou selecione
uma cor personalizada. A paleta se aplica a toda a interface e à animação de
inicialização, com o brilho ajustado para facilitar a leitura. As preferências
são salvas neste navegador; **Restore blue theme** redefine a cor sem alterar as
configurações de som ou de inicialização.

## Notas de Implantação

### GitHub Pages

O workflow em `.github/workflows/deploy.yml` testa, compila e implanta a
aplicação Astro a cada push na `main`, ou por acionamento manual. Em
**Settings > Pages** do repositório, selecione **GitHub Actions** como fonte de
build. A URL esperada para este repositório é
<https://takax170.github.io/my-mona-mayhem/>.

`npm run build:pages` gera arquivos estáticos em `dist/`. A configuração usa
`GITHUB_REPOSITORY` (padrão: `Takax170/my-mona-mayhem`) para definir o domínio do
Pages e o caminho base do repositório. Diferentemente da implantação anterior,
ela publica o app, e não o site standalone do workshop em `docs/`.

O Pages não consegue executar rotas de API. Somente neste build, o navegador
chama `https://github.com/{username}.contribs` diretamente, usando o suporte
público a CORS do GitHub. Ele reutiliza a mesma validação de nome de usuário e de
payload, o mesmo timeout, o mesmo tratamento de erros e o mesmo cache em memória
do serviço do servidor. Não é necessário token nem proxy de terceiros; é preciso
que o GitHub esteja disponível e ofereça suporte a CORS. As sugestões de nomes de
usuário também chamam `https://api.github.com/search/users` diretamente no Pages,
sem token.

### Hospedagem Node

`npm run dev`, `npm run build` e `npm run preview` mantêm a configuração do
servidor Node e os proxies de mesma origem `/api/contributions/:username` e
`/api/users/:query`. Após o build, execute `node dist/server/entry.mjs` em um
host Node.

## Licença

MIT
