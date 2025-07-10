# 🚀 Instruções para Deploy no Vercel

## ✅ Configuração das Variáveis de Ambiente

### 1. Acesse o Dashboard do Vercel
- Vá para [vercel.com](https://vercel.com)
- Faça login na sua conta
- Selecione seu projeto

### 2. Configure as Variáveis de Ambiente
Vá em **Settings** → **Environment Variables** e adicione:

#### **MONGODB_URI**
```
mongodb+srv://webpulse:webpulse225566@reidossalgados.2ygtilt.mongodb.net/?retryWrites=true&w=majority&appName=reidossalgados
```

#### **MONGODB_DB**
```
reidossalgados
```

#### **NODE_ENV**
```
production
```

### 3. Configuração das Variáveis
- **Environment**: Selecione **Production**, **Preview** e **Development**
- **Save** cada variável

## 🔧 Passos para o Deploy

### 1. Commit e Push
```bash
git add .
git commit -m "Preparando deploy para Vercel"
git push origin main
```

### 2. Deploy Automático
- O Vercel detectará automaticamente as mudanças
- Fará o build e deploy automaticamente

### 3. Verificar o Deploy
- Acesse os logs do deploy no Vercel
- Verifique se não há erros de build

## 🐛 Solução de Problemas

### Erro 500 nas APIs
Se ainda houver erros 500:

1. **Verifique os logs** no Vercel Dashboard
2. **Confirme as variáveis** estão configuradas corretamente
3. **Faça um novo deploy** após configurar as variáveis

### Teste de Conexão
Para testar se a conexão está funcionando:

1. Acesse: `https://seu-dominio.vercel.app/api/settings`
2. Deve retornar um JSON com as configurações
3. Se retornar erro 500, verifique os logs

## 📋 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Código commitado e enviado para o repositório
- [ ] Deploy realizado com sucesso
- [ ] APIs funcionando (teste `/api/settings` e `/api/status`)
- [ ] Site carregando corretamente
- [ ] Conexão com MongoDB estabelecida

## 🔗 URLs Importantes

- **Site**: `https://seu-dominio.vercel.app`
- **API Settings**: `https://seu-dominio.vercel.app/api/settings`
- **API Status**: `https://seu-dominio.vercel.app/api/status`
- **Admin**: `https://seu-dominio.vercel.app/admin`

## 📞 Suporte

Se houver problemas:
1. Verifique os logs no Vercel Dashboard
2. Confirme as variáveis de ambiente
3. Teste a conexão com MongoDB localmente
4. Faça um novo deploy

---
**Última atualização**: $(date)
**Status**: Pronto para deploy ✅ 