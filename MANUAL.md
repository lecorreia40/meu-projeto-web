# Manual de uso do VisaOps

Guia de onboarding por perfil. O objetivo e que cada pessoa entenda, em poucos
minutos, onde ela chega ao entrar, o que faz no dia a dia e como aproveitar a
plataforma ao maximo.

Principio que atravessa tudo: o VisaOps organiza, automatiza, educa e acompanha.
Ele nao substitui o advogado. Orientacao juridica de imigracao vem sempre de
advogado licenciado ou representante credenciado. Por isso a plataforma tem
travas de aprovacao humana e a camada de IA recusa pedidos de aconselhamento.

---

## Primeiro acesso (todos os perfis)

1. Abra a URL do sistema e clique em "Sign in".
2. Informe seu e-mail e senha. O escritorio cria seu acesso e define seu perfil.
3. Voce cai direto no portal do seu perfil. Nao existe menu para escolher: o
   sistema leva cada pessoa ao lugar certo.
4. Para sair, use "Sign out" no rodape da barra lateral.

Contas de demonstracao (senha `demo1234`):

| Perfil | E-mail | Portal |
| --- | --- | --- |
| Dono do escritorio | owner@martinezlaw.dev | /firm |
| Advogado | attorney@martinezlaw.dev | /firm |
| Paralegal | paralegal@martinezlaw.dev | /firm |
| Cliente | client@example.dev | /client |
| Parceiro (CPA) | partner@cpafirm.dev | /partner |
| Super admin | admin@visaops.dev | /admin |

O diagnostico publico (intake) fica em `/intake` e nao precisa de login.

---

## Como o sistema pensa (leia antes de comecar)

Tres ideias explicam quase tudo:

- **Caso e a unidade central.** Cada processo de visto e um "caso" com status,
  equipe, prazos, checklist, documentos, tarefas, mensagens e historico.
- **Cada perfil ve so o que deve ver.** Cliente nunca ve notas juridicas nem o
  canal interno. Parceiro so ve a tarefa que recebeu, nunca o caso inteiro.
  Escritorios diferentes nunca veem os dados um do outro.
- **Nada final sai sem aprovacao do advogado.** Mover um caso para "pronto para
  protocolo" exige uma aprovacao registrada.

Os 19 status de um caso, em ordem:

Intake iniciado, Intake completo, Revisao inicial, Proposta enviada, Contrato
assinado, Coleta de documentos, Revisao de evidencias, Elaboracao, Revisao do
advogado, Revisao do cliente, Pronto para protocolo, Protocolado, Recibo
recebido, Biometria/entrevista, RFE/NOID, Aprovado, Negado, Encerrado,
Monitoramento pos-aprovacao.

Os cinco canais de mensagem e quem os enxerga:

| Canal | Para que serve | Quem ve |
| --- | --- | --- |
| Operacional | Coordenacao do dia a dia com o cliente | Equipe, cliente |
| Comercial | Proposta, valores | Equipe, cliente |
| Juridico | Assuntos legais com o cliente | Equipe, cliente |
| Interno | Conversa so da equipe | Apenas a equipe |
| Parceiro | Conversa com um parceiro | Equipe, parceiro |

---

## Onboarding: Dono do escritorio e Firm Admin

**Quem e voce:** responsavel pela operacao. Voce configura a casa, monta a
equipe, acompanha os numeros e garante que os processos rodem.

**Onde voce chega:** `/firm`, o dashboard executivo, com leads novos, casos
ativos, documentos aguardando revisao e tarefas abertas.

**Seu primeiro dia, em passos:**

1. No dashboard, entenda o pulso do escritorio: prazos dos proximos 14 dias e
   casos de alto risco ja aparecem em destaque.
2. Abra "Leads" e veja o funil comercial (do lead novo ao contrato assinado).
   Cadastre um lead ou mova um card de estagio para sentir o fluxo.
3. Em "Clients", cadastre um cliente. Em "Cases", abra um caso escolhendo
   cliente, categoria de visto e prioridade. O checklist de documentos e gerado
   automaticamente pela categoria.
4. Percorra "Documents" (fila de revisao), "Partners" (parceiros e escopos),
   "Billing" (faturas e recebimentos) e "Compliance" (calendario pos-aprovacao).

**Como aproveitar ao maximo:**

- Use o dashboard como reuniao diaria: prazos criticos e alto risco primeiro.
- Separe sempre nota comercial de nota juridica. O funil de leads e comercial;
  a estrategia do caso e juridica e fica protegida.
- O calendario de compliance e onde nasce receita recorrente: renovacoes,
  vencimentos de status e obrigacoes da empresa do cliente.

**O que voce nao faz:** o dono nao cria estrategia juridica nem envia parecer.
Isso e do advogado. Voce garante a operacao; o advogado responde pelo merito.

---

## Onboarding: Advogado e Supervising Attorney

**Quem e voce:** o responsavel legal pelo caso. Nada final sai sem a sua
aprovacao. Voce define estrategia, revisa evidencias e assina os gates.

**Onde voce chega:** `/firm`, com foco no que exige sua decisao.

**Seu primeiro dia, em passos:**

1. Abra um caso em "Cases" (por exemplo o caso demo `MIL-2026-0001`, um E-2).
2. No topo do caso, veja status, risco, progresso, equipe, proxima acao e prazo.
   Se houver riscos abertos, eles aparecem em um bloco vermelho.
3. Revise o checklist e os documentos enviados. Aprove, rejeite ou peca ajustes.
   Documento rejeitado volta para o cliente com o motivo.
4. Registre suas notas juridicas privadas. Escolha a visibilidade "Equipe
   juridica" ou "Somente advogado". Cliente e parceiro nunca leem essas notas.
5. Use os "gates de aprovacao": estrategia legal, documentos completos, rascunho
   da peticao, pronto para protocolo. Registre a decisao em cada etapa.
6. Ao mover o caso para "Pronto para protocolo" ou "Protocolado", o sistema
   exige o gate de filing aprovado. Se voce tem permissao de aprovar, a propria
   mudanca registra a aprovacao.

**Como aproveitar ao maximo:**

- Trate os gates como sua trilha de responsabilidade. Cada decisao fica no
  historico com autor e data, o que protege voce e o cliente.
- Use o canal Interno para alinhar com paralegal sem que o cliente veja.
- A camada de IA pode resumir documentos e apontar inconsistencias, mas toda
  sugestao de rota entra como rascunho ate a sua revisao. A IA nunca muda status
  nem envia documento sozinha.

**O que voce nao faz:** voce nao precisa cuidar da coleta operacional de
documentos; delegue ao paralegal e ao case manager e concentre-se no merito.

---

## Onboarding: Paralegal

**Quem e voce:** o motor operacional do caso. Voce coleta documentos, organiza
tarefas, prepara rascunhos e mantem o caso andando.

**Onde voce chega:** `/firm`, com acesso a casos, tarefas e documentos.

**Seu primeiro dia, em passos:**

1. Abra um caso e veja o checklist gerado pela categoria de visto. Cada item tem
   dono (cliente, empresa do cliente, parceiro) e status.
2. Faca upload de documentos por item do checklist. O item passa a "Enviado" e
   entra na fila de revisao do advogado.
3. Crie tarefas para cliente, colegas e parceiros, com responsavel e prazo.
4. Converse pelos canais Operacional e Interno. Voce pode ler o canal interno.
5. Acompanhe a timeline: tudo que acontece no caso fica registrado ali.

**Como aproveitar ao maximo:**

- Voce pode sugerir o resultado de uma revisao de documento, mas a aprovacao
  final e do advogado. Deixe os itens prontos para ele so confirmar.
- Notas juridicas: voce enxerga as de "Equipe juridica", nao as de "Somente
  advogado". Use isso para se orientar sem invadir o que e restrito.

**O que voce nao faz:** voce nao cria estrategia juridica, nao aprova documentos
em definitivo e nao assina os gates de filing.

---

## Onboarding: Case Manager e Intake Specialist

**Quem e voce:** o Case Manager coordena cliente, prazos e parceiros. O Intake
Specialist faz a triagem comercial e transforma interesse em caso.

**Onde voce chega:** `/firm`.

**Seu primeiro dia, em passos:**

1. Intake Specialist: comece em "Leads". Cadastre, qualifique e mova os cards
   pelo funil ate o contrato assinado. Cada diagnostico publico vira um lead
   automaticamente.
2. Case Manager: use "Tasks" para ver tudo que esta em aberto por caso, e
   "Compliance" para prazos pos-aprovacao.
3. Convide e acompanhe parceiros em "Partners", sempre com um escopo definido.

**Como aproveitar ao maximo:**

- O funil separa claramente estagio comercial de caso ativo. Use os scores de
  lead para priorizar contato.
- Como coordenador, o canal Operacional e seu principal instrumento com o
  cliente; o Interno, com a equipe.

**O que voce nao faz:** nenhum dos dois cria parecer juridico nem aprova o
merito. Voces preparam o terreno para o advogado decidir.

---

## Onboarding: Cliente (aplicante principal)

**Quem e voce:** a pessoa em processo de visto. O sistema foi feito para voce
entender seu processo sem jargao juridico.

**Onde voce chega:** `/client`, com uma visao simples do seu caso.

**Seu primeiro dia, em passos:**

1. Na tela "My Case", veja em que etapa voce esta, o progresso, a proxima acao,
   o prazo e quem e o responsavel atual (voce ou a equipe).
2. Em "Documents", envie cada documento pedido. Formatos aceitos: PDF, JPG, PNG
   ou DOCX ate 20MB. Se um documento for rejeitado, o motivo aparece ali.
3. Em "Tasks", veja o que a equipe pediu e marque como feito.
4. Em "Messages", fale com sua equipe. O historico fica guardado para voce.
5. "Payments" mostra suas faturas e o que ja foi pago. "Timeline" mostra tudo
   que aconteceu no processo.

**Como aproveitar ao maximo:**

- Sempre que aparecer "Acao necessaria" ou "Aguardando seus documentos", voce e
  o responsavel. Resolver rapido acelera todo o processo.
- Voce ve sempre o status em linguagem clara ("Em revisao pelo advogado",
  "Pronto para protocolo"), nao a tela tecnica do escritorio.

**O que voce nao ve:** notas juridicas privadas da equipe e conversas internas.
Isso e normal e existe para proteger a estrategia do seu proprio caso.

---

## Onboarding: Parceiro (CPA, business plan, traducao e outros)

**Quem e voce:** um profissional externo contratado para uma entrega especifica
(relatorio de origem de fundos, plano de negocios, traducao, avaliacao e afins).

**Onde voce chega:** `/partner`, mostrando apenas o que foi compartilhado com
voce.

**Seu primeiro dia, em passos:**

1. Em "Assigned Tasks", veja as tarefas do seu escopo. Cada bloco mostra o caso,
   o escopo contratado e o prazo de acesso, se houver.
2. Faca upload da sua entrega direto na tarefa e marque como concluida.
3. Em "Documents shared with me", acompanhe apenas os arquivos que voce enviou.

**Como aproveitar ao maximo:**

- Seu acesso e proposital e limitado. Voce nao ve o caso inteiro nem os outros
  parceiros, e isso protege o cliente e voce.
- Se o acesso tem data de expiracao, entregue dentro do prazo para nao perder a
  janela.

**O que voce nao ve:** o dossie completo do caso, notas juridicas, dados de
outros parceiros e qualquer coisa fora do seu escopo.

---

## Onboarding: Super Admin da plataforma

**Quem e voce:** administrador da plataforma inteira, acima dos escritorios.
Toda acao sua e auditada.

**Onde voce chega:** `/admin`, com a visao cruzada de tenants, usuarios, casos e
documentos.

**Seu primeiro dia, em passos:**

1. Na visao geral, acompanhe tenants ativos, volume de casos e documentos e o
   contador de pedidos de IA bloqueados pela trava de aconselhamento.
2. Em "Tenants", veja cada escritorio com seus numeros. Os dados sao isolados
   por tenant: um nunca ve o outro.
3. Em "Visa Categories", gerencie o motor de vistos: categorias, requisitos e
   regras de checklist sao configuracao, nao codigo.
4. Em "Audit Log", acompanhe a trilha imutavel de acoes sensiveis, incluindo
   tentativas de acesso negadas.

**Como aproveitar ao maximo:**

- Use o audit log como sua principal ferramenta de governanca e conformidade.
- Ao ajustar uma categoria de visto, lembre que a mudanca afeta os checklists de
  todos os novos casos daquela categoria.

**O que voce nao faz:** o super admin nao substitui o advogado de um caso. Voce
administra a plataforma; o merito de cada caso continua com o escritorio.

---

## Dez dicas para extrair o maximo

1. Comece o dia pelo dashboard: prazos e risco antes de qualquer coisa.
2. Abra o caso pela categoria certa; o checklist correto vem de graca.
3. Rejeite documentos com um motivo claro; o cliente corrige mais rapido.
4. Registre os gates do advogado; eles sao a sua trilha de responsabilidade.
5. Use o canal certo: Interno para a equipe, Operacional para o cliente.
6. Trate parceiro por escopo, nunca dando visao do caso inteiro.
7. Cliente: resolva tudo marcado como "Acao necessaria" primeiro.
8. Alimente o compliance pos-aprovacao; e receita recorrente e retencao.
9. Confie na IA para resumir e apontar inconsistencias, nunca para decidir.
10. Consulte o audit log quando precisar entender quem fez o que e quando.

---

## Aviso legal

Esta plataforma apoia fluxos de imigracao, mas nao presta aconselhamento
juridico. Orientacao juridica de imigracao deve vir de advogado licenciado ou
representante credenciado.
