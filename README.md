# Calculadora de IMC

Projeto da disciplina de Cultura e Práticas DevOps. O objetivo é desenvolver uma calculadora simples de Índice de Massa Corporal (IMC) e praticar o desenvolvimento em pequenas etapas, com commits ao longo do processo.

## Funcionalidades

- Entrada de peso em quilogramas e altura em metros.
- Cálculo pela fórmula `IMC = peso / (altura × altura)`, com duas casas decimais.
- Classificação: abaixo do peso, peso normal, sobrepeso e obesidade graus I, II e III.
- Validação de campos vazios, zero, valores negativos e entradas não numéricas ou infinitas.
- Exibição do resultado ou de uma mensagem de erro, com foco no campo inválido.

## Tecnologias

HTML, CSS e JavaScript puro, sem frameworks, backend ou banco de dados. O projeto usa Git e GitHub para versionamento, GitHub Actions para CI/CD, HTMLHint para lint, Node.js para testes, Semgrep para SAST e OWASP ZAP para DAST.

## Como executar

Abra o arquivo `index.html` no navegador. Não é necessário instalar dependências nem executar uma etapa de build.

Versão publicada: [Calculadora de IMC no GitHub Pages](https://roberioarnaud.github.io/calculadora-imc/).

## Como rodar os testes

Com o Node.js 24 instalado, execute na pasta do projeto:

```sh
node --test
```

O arquivo `tests/script.test.cjs` contém 21 testes para cálculo, arredondamento, limites das classificações e validações de entrada. Usa o executor nativo do Node.js e simula os elementos acessados pelo script, sem bibliotecas externas. Esses testes não substituem uma verificação visual no navegador.

Para executar o mesmo lint de HTML usado no CI, com npm disponível:

```sh
npx --yes htmlhint@1.9.2 index.html
```

Esse comando baixa o HTMLHint na primeira execução e exige acesso à internet.

## Fluxo de CI/CD

O workflow [ci.yml](.github/workflows/ci.yml) executa em pushes na `main` e em Pull Requests destinados à `main`:

1. **Lint:** valida o `index.html` com HTMLHint.
2. **Testes:** executa `node --test`, dependendo do lint com `needs: lint`.
3. **SAST:** analisa o JavaScript com Semgrep, dependendo dos testes com `needs: testes`.

O workflow [deploy.yml](.github/workflows/deploy.yml) é acionado ao terminar o CI, mas só publica quando ele passou em um push na `main` do próprio repositório. O CI de um Pull Request não dispara uma publicação; após o merge, o push resultante na `main` passa novamente pelo CI.

O deploy usa exatamente o commit aprovado pelo CI e publica apenas `index.html`, `style.css` e `script.js`. Depois da publicação, o job DAST analisa o site no GitHub Pages, usando `needs: publicar`.

Fluxo completo:

```text
Push na main → lint → testes → SAST → deploy no Pages → DAST
Pull Request para main → lint → testes → SAST
```

O CI verifica Pull Requests, mas não há proteção de branch configurada para obrigar sua aprovação antes do merge. Como o DAST ocorre após o deploy, uma falha nessa análise não desfaz a publicação.

## SAST com Semgrep

O CI usa a imagem `semgrep/semgrep:1.185.0` e o conjunto de regras `p/javascript`. A opção `--error` faz o job falhar quando encontra achados; a execução não exige uma conta ou token do Semgrep. O SAST analisa o código sem executar a aplicação.

## DAST com OWASP ZAP

O deploy usa `zaproxy/action-baseline@v0.15.0` para rastrear o site publicado e executar análise passiva. Esse baseline não é uma varredura ativa completa nem garante ausência de vulnerabilidades.

- O escopo é restrito a `https://roberioarnaud.github.io/calculadora-imc/` e seus caminhos e parâmetros.
- A raiz do domínio e suas páginas 404, como `/robots.txt` e `/sitemap.xml`, ficam fora do escopo.
- O artefato `relatorio-zap`, disponível na execução do workflow Deploy no GitHub Actions, contém os relatórios HTML, JSON e Markdown.
- A criação automática de issues está desativada.
- `fail_action: true` permanece habilitado: avisos não excepcionados, achados classificados como falha e erros de execução continuam bloqueando a aprovação do job.

## CSP e exceções do GitHub Pages

O `index.html` define uma CSP por `<meta>`, permitindo scripts e estilos da própria origem e bloqueando objetos incorporados, alteração da URL base e envio de formulários. O cálculo é feito localmente pelo JavaScript.

O GitHub Pages não oferece configuração nativa de cabeçalhos HTTP pelo repositório. Por isso, os seguintes achados têm tratamento documentado em [.zap/rules.tsv](.zap/rules.tsv):

| Regra | Tratamento e justificativa |
| --- | --- |
| `10020` | Informativo: proteção contra clickjacking exige `X-Frame-Options` ou `frame-ancestors` em cabeçalho HTTP. |
| `10021` | Informativo: `X-Content-Type-Options: nosniff` depende da hospedagem. |
| `10063` | Informativo: `Permissions-Policy` depende da hospedagem; a aplicação não usa câmera, microfone ou localização. |
| `10098` | Informativo: CORS permissivo do Pages para arquivos públicos; não há API autenticada ou respostas privadas. |
| `90004` | Informativo: COEP e COOP dependem da hospedagem; o projeto não usa recursos que exigem esse isolamento. |
| `10015`, `10049`, `10050` | Informativos: cache de arquivos estáticos públicos é esperado; o servidor não gera resultados pessoais de IMC. |
| `10109` | Informativo: presença de JavaScript, sem vulnerabilidade demonstrada por esse aviso. |
| `10038` | Falha: a ausência de CSP continua bloqueante. |

O arquivo [.zap/hooks.py](.zap/hooks.py) configura o escopo e reclassifica como informativo o achado da regra `10055` cuja evidência corresponde exatamente à CSP revisada do projeto. Nessa política, falta somente `frame-ancestors`, que não funciona por `<meta>`. Outras evidências de CSP continuam sujeitas à análise normal.

Essas exceções representam riscos aceitos para esta calculadora estática no Pages, não correções dos cabeçalhos. Os achados permanecem nos relatórios. Elas devem ser revistas se a CSP, a hospedagem ou as funcionalidades mudarem, especialmente se forem adicionados autenticação ou dados privados.
