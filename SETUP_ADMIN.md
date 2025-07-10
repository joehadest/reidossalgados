# Configuração do Administrador

## Problema
O erro "Configuração de administrador não encontrada" aparece porque não existe um documento na coleção `admin` do banco de dados.

## Solução

### 1. Acesse a página de inicialização
Navegue para: `http://localhost:3000/admin/init`

### 2. Configure a senha do administrador
- Digite uma senha com pelo menos 6 caracteres
- Confirme a senha
- Clique em "Configurar Administrador"

### 3. Faça login
Após a configuração, você será redirecionado para a página de login:
`http://localhost:3000/admin/login`

Use a senha que você configurou para fazer login.

### 4. Acesse o painel administrativo
Após o login bem-sucedido, você terá acesso ao painel administrativo onde poderá:
- Alterar a senha
- Configurar horários de funcionamento
- Gerenciar taxas de entrega
- Editar informações do estabelecimento
- Gerenciar pedidos
- Adicionar itens e categorias

## APIs Criadas

### `/api/init-admin` (POST)
- Inicializa a configuração do administrador
- Cria o documento na coleção `admin`
- Criptografa a senha com bcrypt

### `/api/auth` (POST)
- Autentica o administrador
- Verifica a senha no banco de dados
- Retorna sucesso/erro

### `/api/change-password` (POST)
- Permite alterar a senha do administrador
- Valida a senha atual
- Criptografa a nova senha

## Segurança
- Todas as senhas são criptografadas com bcrypt
- Validações de entrada em todas as APIs
- Middleware protege rotas administrativas
- Cookies de autenticação com expiração 