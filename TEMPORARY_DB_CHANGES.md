# Mudanças Temporárias no Banco de Dados

## Resumo
O banco de dados MongoDB foi temporariamente removido do sistema para permitir a configuração de um novo banco de dados. Durante este período, o sistema está funcionando com dados estáticos e temporários em memória.

## Mudanças Realizadas

### 1. Menu (Cardápio)
- **Arquivo**: `src/app/api/menu/route.ts`
- **Mudança**: Substituído MongoDB por dados estáticos do arquivo `src/data/menu.ts`
- **Funcionalidade**: 
  - ✅ GET - Retorna dados do cardápio
  - ❌ POST/PUT/DELETE - Desabilitados (retorna erro 405)

### 2. Pedidos
- **Arquivo**: `src/app/api/pedidos/route.ts`
- **Mudança**: Substituído MongoDB por armazenamento temporário em memória
- **Funcionalidade**: 
  - ✅ GET - Busca pedidos (por ID ou telefone)
  - ✅ POST - Cria novos pedidos
  - ✅ PATCH - Atualiza pedidos
  - ✅ DELETE - Remove pedidos
- **Limitação**: Dados são perdidos quando o servidor reinicia

### 3. Pedidos por ID
- **Arquivo**: `src/app/api/pedidos/[id]/route.ts`
- **Mudança**: Substituído MongoDB por armazenamento temporário em memória
- **Funcionalidade**: 
  - ✅ GET - Busca pedido específico
  - ✅ PATCH - Atualiza pedido específico
  - ✅ DELETE - Remove pedido específico

### 4. Notificações
- **Arquivo**: `src/app/api/notifications/route.ts`
- **Mudança**: Substituído MongoDB por armazenamento temporário em memória
- **Funcionalidade**: 
  - ✅ GET - Busca notificações não lidas
  - ✅ POST - Cria novas notificações
  - ✅ PATCH - Marca notificações como lidas

### 5. Configurações
- **Arquivo**: `src/app/api/settings/route.ts`
- **Mudança**: Substituído MongoDB por configurações temporárias em memória
- **Funcionalidade**: 
  - ✅ GET - Retorna configurações atuais
  - ✅ PUT - Atualiza configurações

### 6. Status do Restaurante
- **Arquivo**: `src/app/api/status/route.ts`
- **Mudança**: Substituído MongoDB por status temporário em memória
- **Funcionalidade**: 
  - ✅ GET - Retorna status atual
  - ✅ PATCH - Atualiza status

### 7. Push Subscriptions
- **Arquivo**: `src/app/api/push-subscribe/route.ts`
- **Mudança**: Substituído MongoDB por armazenamento temporário em memória
- **Funcionalidade**: 
  - ✅ POST - Salva subscription temporariamente

### 8. Rotas de Seed
- **Arquivos**: 
  - `src/app/api/menu/seed/route.ts`
  - `src/app/api/pedidos/seed/route.ts`
- **Mudança**: Desabilitadas (retornam erro 405)
- **Motivo**: Não são necessárias com dados estáticos/temporários

## Arquivos de Conexão MongoDB Mantidos
Os seguintes arquivos foram mantidos para facilitar a reativação futura:
- `src/app/api/mongodb.ts`
- `src/lib/mongodb.ts`

## Como Reativar o MongoDB

### 1. Restaurar Conexões
- Remover comentários ou restaurar imports do MongoDB nas rotas
- Verificar se as variáveis de ambiente estão configuradas:
  - `MONGODB_URI`
  - `MONGODB_DB`

### 2. Restaurar Schemas
- Reativar schemas do Mongoose onde necessário
- Restaurar validações de dados

### 3. Migrar Dados
- Se necessário, migrar dados temporários para o novo banco
- Executar scripts de seed se aplicável

### 4. Testar Funcionalidades
- Verificar se todas as rotas estão funcionando
- Testar operações CRUD
- Validar notificações e WebSocket

## Limitações Atuais

1. **Persistência**: Dados são perdidos quando o servidor reinicia
2. **Escalabilidade**: Não suporta múltiplas instâncias do servidor
3. **Backup**: Não há backup automático dos dados
4. **Consultas Complexas**: Funcionalidades avançadas de busca podem estar limitadas

## Próximos Passos

1. Configurar novo banco de dados MongoDB
2. Restaurar conexões e schemas
3. Migrar dados se necessário
4. Testar todas as funcionalidades
5. Remover este arquivo de documentação

---
**Data**: $(date)
**Versão**: Temporária
**Status**: Aguardando nova configuração do banco de dados 