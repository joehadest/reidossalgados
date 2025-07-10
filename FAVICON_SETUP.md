# Configuração dos Favicons - Rei dos Salgados

## 📁 Estrutura de Arquivos

Os favicons estão localizados em `/public/favicon/` com os seguintes arquivos:

### Ícones Principais
- `favicon.ico` - Favicon principal (16KB)
- `favicon-16x16.png` - Favicon 16x16 pixels (570B)
- `favicon-32x32.png` - Favicon 32x32 pixels (1.3KB)

### Ícones para Dispositivos Móveis
- `android-chrome-192x192.png` - Ícone Android 192x192 (18KB)
- `android-chrome-512x512.png` - Ícone Android 512x512 (88KB)
- `apple-touch-icon.png` - Ícone Apple Touch 180x180 (16KB)

### Configuração
- `site.webmanifest` - Manifesto do PWA com configurações

## ⚙️ Configuração no Layout

### Metadata (Next.js 13+)
```typescript
export const metadata: Metadata = {
    title: "Rei dos Salgados - Cardápio Digital",
    description: "Cardápio digital do Rei dos Salgados",
    manifest: '/favicon/site.webmanifest',
    icons: {
        icon: [
            { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        ],
        apple: [
            { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
        other: [
            { url: '/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { url: '/favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: "Rei dos Salgados"
    }
};
```

### Links HTML
```html
<link rel="manifest" href="/favicon/site.webmanifest" />
<link rel="icon" type="image/x-icon" href="/favicon/favicon.ico" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
```

## 🎨 Configuração do Web Manifest

### site.webmanifest
```json
{
  "name": "Rei dos Salgados",
  "short_name": "Rei dos Salgados",
  "description": "Cardápio digital do Rei dos Salgados",
  "icons": [
    {
      "src": "/favicon/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/favicon/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#facc15",
  "background_color": "#111827",
  "display": "standalone",
  "start_url": "/",
  "scope": "/"
}
```

## 📱 Compatibilidade

### Navegadores Desktop
- ✅ Chrome, Firefox, Safari, Edge
- ✅ Favicon.ico e PNG
- ✅ Diferentes tamanhos suportados

### Dispositivos Móveis
- ✅ iOS (Apple Touch Icon)
- ✅ Android (Chrome Icons)
- ✅ PWA Support

### PWA (Progressive Web App)
- ✅ Manifesto configurado
- ✅ Ícones para instalação
- ✅ Tema e cores personalizadas

## 🔧 Manutenção

### Para Atualizar Favicons
1. Substitua os arquivos em `/public/favicon/`
2. Mantenha os mesmos nomes de arquivo
3. Verifique se os tamanhos estão corretos
4. Teste em diferentes dispositivos

### Tamanhos Recomendados
- `favicon.ico`: 16x16, 32x32, 48x48 (múltiplos tamanhos em um arquivo)
- `favicon-16x16.png`: 16x16 pixels
- `favicon-32x32.png`: 32x32 pixels
- `apple-touch-icon.png`: 180x180 pixels
- `android-chrome-192x192.png`: 192x192 pixels
- `android-chrome-512x512.png`: 512x512 pixels

## 🎯 Benefícios

- ✅ **Identidade Visual:** Logo consistente em todas as plataformas
- ✅ **PWA:** Suporte completo para instalação como app
- ✅ **SEO:** Melhora a presença nos resultados de busca
- ✅ **UX:** Experiência profissional e polida
- ✅ **Compatibilidade:** Funciona em todos os dispositivos modernos 