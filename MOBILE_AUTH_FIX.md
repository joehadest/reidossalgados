# Solução para Problema de Relogin em Mobile

## Problema Identificado
O usuário relatou que o site fica "relogando" (fazendo logout automático) a cada alguns segundos quando testado em dispositivos móveis.

## Causas Possíveis
1. **Configuração de Cookies**: Cookies de autenticação não configurados adequadamente para mobile
2. **Problemas de Conectividade**: Rede instável causando perda de sessão
3. **Cache do Browser**: Cache agressivo em mobile interferindo com cookies
4. **Middleware**: Verificações muito rígidas de autenticação
5. **Context Providers**: Verificações excessivas que invalidam sessão

## Soluções Implementadas

### 1. Gerenciador de Cookies Aprimorado (`/src/utils/auth-cookies.ts`)
- Configurações específicas para mobile (`sameSite: 'lax'`)
- Detecção automática de HTTPS para `secure: true`
- Sistema de diagnóstico para debug
- Renovação automática de cookies

### 2. AuthGuard com Notificações (`/src/components/AuthGuard.tsx`)
- Verificação periódica de autenticação (30 segundos)
- Sistema de notificações para avisar sobre problemas
- Renovação automática de sessão
- Verificação quando a página ganha foco

### 3. Middleware Otimizado (`/src/middleware.ts`)
- Verificação mais robusta de cookies
- Limpeza de cookies inválidos
- Logs removidos para produção

### 4. Configurações de Layout (`/src/app/layout.tsx`)
- Meta tags específicas para mobile
- Configurações de cache para evitar problemas
- Status de conectividade

### 5. Monitoramento de Conectividade (`/src/components/ConnectivityStatus.tsx`)
- Detecção de problemas de rede
- Verificação periódica de conectividade
- Alertas para o usuário

## Como Testar

### 1. Debug no Mobile
1. Acesse `/admin/login` no mobile
2. Clique no botão "Debug (Mobile)"
3. Verifique as informações exibidas:
   - Auth: ✅ ou ❌
   - Cookie: valor do cookie
   - Protocol: http ou https
   - UserAgent: Mobile ou Desktop

### 2. Verificar Logs
Abra o console do navegador e observe os logs:
```
Verificação de autenticação: { pathname, isAuth, cookie, timestamp }
```

### 3. Testar Conectividade
- Observer se aparece a notificação de conectividade
- Teste em diferentes tipos de rede (WiFi, 4G, 3G)

## Comandos de Debug

### Console do Navegador (F12)
```javascript
// Verificar cookies manualmente
document.cookie

// Testar o gerenciador de cookies
import('@/utils/auth-cookies').then(AuthCookieManager => {
    AuthCookieManager.default.diagnose();
});
```

### Verificar Status de Autenticação
```javascript
// No console do navegador
localStorage.getItem('authDebug') // Para debug local
```

## Configurações Adicionais

### 1. Para HTTPS (Produção)
Certifique-se de que o site está rodando em HTTPS para cookies seguros funcionarem corretamente.

### 2. Para Desenvolvimento
Se estiver testando em desenvolvimento (HTTP), os cookies funcionarão sem `secure: true`.

### 3. Network Tab
Use a aba Network do DevTools para verificar:
- Se as requisições estão sendo feitas corretamente
- Se os cookies estão sendo enviados nos headers
- Se há problemas de CORS

## Possíveis Problemas Restantes

### 1. Cache do Navegador Mobile
Limpe o cache do navegador mobile:
- Android Chrome: Configurações > Privacidade > Limpar dados
- iOS Safari: Configurações > Safari > Limpar histórico

### 2. Modo Privado/Incógnito
Teste em modo privado para verificar se é problema de cache.

### 3. Diferentes Navegadores
Teste em diferentes navegadores mobile:
- Chrome Mobile
- Safari Mobile
- Firefox Mobile
- Samsung Internet

### 4. Configurações de Cookies do Navegador
Verifique se o navegador mobile não está bloqueando cookies de terceiros.

## Monitoramento

### Logs Importantes
- `Verificação de autenticação`: Mostra o status a cada verificação
- `Cookie obtido`: Mostra quando cookies são lidos
- `Definindo cookie de autenticação`: Mostra quando cookies são criados
- `Redirecionando para login`: Mostra quando logout acontece

### Notificações para o Usuário
- **Sessão expirada**: Quando logout automático acontece
- **Problema de conectividade**: Quando há problemas de rede
- **Sessão renovada**: Quando a sessão é automaticamente renovada

## Próximos Passos

Se o problema persistir:

1. **Verificar Logs**: Anotar exatamente quando e como o logout acontece
2. **Testar em Desktop**: Comparar comportamento entre mobile e desktop
3. **Verificar Rede**: Testar em diferentes redes (WiFi, móvel)
4. **Browser específico**: Identificar se é específico de um navegador
5. **Configurar logs mais detalhados**: Adicionar mais logs temporários para debug

## Comandos para Reverter (se necessário)

Se alguma mudança causar problemas, você pode:

1. Voltar ao sistema de cookies simples
2. Remover o AuthGuard
3. Simplificar o middleware
4. Remover verificações periódicas

Todas as mudanças foram feitas de forma modular para facilitar reversão.
