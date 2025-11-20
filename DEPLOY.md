# Guia de Deploy - Hostinger

## Configuração do .htaccess

O arquivo `.htaccess` foi criado para resolver o problema de 404 ao acessar URLs diretamente ou atualizar a página.

### O que o .htaccess faz:

1. **Redirecionamento para SPA**: Redireciona todas as requisições para `index.html`, permitindo que o React Router funcione corretamente
2. **Compressão GZIP**: Comprime arquivos para melhor performance
3. **Cache**: Configura cache para arquivos estáticos
4. **Segurança**: Previne acesso a arquivos sensíveis

## Passos para Deploy na Hostinger

### 1. Build do Projeto

```bash
npm run build
```

Isso vai:
- Criar a pasta `dist/` com os arquivos otimizados
- Copiar automaticamente o `.htaccess` para a pasta `dist/`

### 2. Upload para Hostinger

1. Acesse o **File Manager** do seu painel Hostinger
2. Navegue até a pasta `public_html` (ou a pasta do seu domínio)
3. **Faça backup** dos arquivos atuais (se houver)
4. **Delete** todos os arquivos antigos (exceto `.htaccess` se já existir)
5. Faça upload de **TODOS** os arquivos da pasta `dist/`:
   - `index.html`
   - Pasta `assets/` (com todos os arquivos JS e CSS)
   - `.htaccess` (IMPORTANTE: deve estar na mesma pasta do index.html)

### 3. Verificar Estrutura no Servidor

A estrutura no servidor deve ficar assim:

```
public_html/
├── index.html
├── .htaccess
└── assets/
    ├── index-[hash].js
    └── index-[hash].css
```

### 4. Configurações Adicionais (Opcional)

Se você estiver usando um subdiretório (ex: `public_html/psic-gestor/`), você precisa:

1. Atualizar `vite.config.js`:
```js
export default defineConfig({
  plugins: [react()],
  base: '/psic-gestor/', // substitua pelo caminho correto
})
```

2. Rebuildar:
```bash
npm run build
```

### 5. Verificar Permissões

Certifique-se de que:
- O arquivo `.htaccess` está na raiz do `public_html`
- As permissões estão corretas (geralmente 644 para arquivos)

## Testando

Após o upload:

1. ✅ Acesse `https://psicgestor.venturize.com.br/` - deve carregar normalmente
2. ✅ Acesse diretamente `https://psicgestor.venturize.com.br/pacientes/[id]` - não deve dar 404
3. ✅ Na página de pacientes, atualize (F5) - não deve dar 404

## Troubleshooting

### Ainda dá 404?

1. Verifique se o `.htaccess` está na pasta correta (mesma do `index.html`)
2. Verifique se o módulo `mod_rewrite` está habilitado no Apache da Hostinger
3. Entre em contato com o suporte da Hostinger se o problema persistir

### Arquivos não carregam?

1. Verifique os caminhos no `index.html` (devem começar com `/assets/`)
2. Verifique se todos os arquivos da pasta `assets/` foram enviados
3. Limpe o cache do navegador (Ctrl+Shift+R)

### .htaccess não funciona?

1. Verifique a sintaxe do arquivo
2. Tente renomear temporariamente para `htaccess.txt` e depois voltar para `.htaccess`
3. Entre em contato com o suporte da Hostinger

## Notas Importantes

- ⚠️ **SEMPRE** faça backup antes de fazer upload
- ⚠️ O arquivo `.htaccess` deve estar na raiz do `public_html`
- ⚠️ Após cada build, você precisa fazer upload novamente dos arquivos
- ⚠️ O `.htaccess` já é copiado automaticamente na pasta `dist/` ao rodar `npm run build`










