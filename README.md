# Rei dos Salgados - Cardápio Digital

Um cardápio digital moderno e responsivo para o restaurante Rei dos Salgados, desenvolvido com Next.js, TypeScript e Tailwind CSS.

## 🍽️ Sobre o Projeto

O Rei dos Salgados é um restaurante especializado em salgados brasileiros tradicionais. Este cardápio digital oferece uma experiência moderna para os clientes visualizarem o menu, fazerem pedidos e acompanharem o status de suas entregas.

## ✨ Funcionalidades

- **Cardápio Digital**: Visualização completa do menu com categorias
- **Sistema de Pedidos**: Interface intuitiva para fazer pedidos
- **Carrinho de Compras**: Gerenciamento de itens selecionados
- **Acompanhamento de Pedidos**: Status em tempo real dos pedidos
- **Responsivo**: Funciona perfeitamente em dispositivos móveis e desktop
- **PWA**: Funciona como aplicativo web progressivo
- **Notificações**: Sistema de notificações push para atualizações

## 🎨 Design

- **Tema**: Preto e Amarelo (cores do restaurante)
- **Interface**: Moderna e intuitiva
- **Animações**: Transições suaves com Framer Motion
- **Acessibilidade**: Design acessível e inclusivo

## 🛠️ Tecnologias Utilizadas

- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática para maior segurança
- **Tailwind CSS**: Framework CSS utilitário
- **Framer Motion**: Animações e transições
- **React Icons**: Ícones modernos
- **PWA**: Progressive Web App

## 📱 Categorias do Cardápio

- **Salgados Fritos**: Coxinhas, risoles, pastéis, kibes
- **Salgados Assados**: Empadas, quiches
- **Salgados de Massas**: Enroladinhos, pão de queijo
- **Salgados Especiais**: Versões premium com ingredientes especiais
- **Porções**: Combos e porções para grupos
- **Bebidas**: Refrigerantes, cervejas e destilados

## 🚀 Como Executar

1. **Clone o repositório**:
   ```bash
   git clone [url-do-repositorio]
   cd salgados
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Execute em desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Acesse no navegador**:
   ```
   http://localhost:3000
   ```

## 📦 Scripts Disponíveis

- `npm run dev`: Executa em modo desenvolvimento
- `npm run build`: Gera build de produção
- `npm run start`: Executa build de produção
- `npm run lint`: Executa linter

## 🌐 Deploy

O projeto está configurado para deploy na Vercel com as seguintes configurações:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## 📋 Estrutura do Projeto

```
src/
├── app/                 # App Router do Next.js
│   ├── api/            # Rotas da API
│   ├── admin/          # Páginas administrativas
│   ├── menu/           # Página do cardápio
│   └── globals.css     # Estilos globais
├── components/         # Componentes React
├── contexts/          # Contextos React
├── data/              # Dados estáticos
├── lib/               # Utilitários
├── types/             # Definições TypeScript
└── utils/             # Funções utilitárias
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Configurações do MongoDB (quando reativado)
MONGODB_URI=sua_uri_do_mongodb
MONGODB_DB=nome_do_banco

# Configurações de notificação
VAPID_PUBLIC_KEY=sua_chave_publica_vapid
VAPID_PRIVATE_KEY=sua_chave_privada_vapid
```

## 📞 Contato

- **Restaurante**: Rei dos Salgados
- **Endereço**: Rua Maria Luiza Dantas, Alto Rodrigues - RN
- **Telefone**: +55 84 9872-9126
- **Instagram**: @reidossalgados

## 👨‍💻 Desenvolvimento

Desenvolvido por **WebPulse** com foco em qualidade, performance e experiência do usuário.

## 📄 Licença

Este projeto é privado e de uso exclusivo do Rei dos Salgados.

---

**Rei dos Salgados** - Os melhores salgados da região! 👑🍽️ 