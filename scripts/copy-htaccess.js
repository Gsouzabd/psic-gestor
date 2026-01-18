import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

// Script para copiar .htaccess para o diretório dist após o build
// Se o arquivo não existir, o script simplesmente não faz nada (não gera erro)

const htaccessSource = join(process.cwd(), '.htaccess');
const htaccessDest = join(process.cwd(), 'dist', '.htaccess');

try {
  if (existsSync(htaccessSource)) {
    copyFileSync(htaccessSource, htaccessDest);
    console.log('✓ .htaccess copiado para dist/');
  } else {
    console.log('ℹ .htaccess não encontrado, pulando cópia...');
  }
} catch (error) {
  console.warn('⚠ Aviso ao copiar .htaccess:', error.message);
  // Não falha o build se houver erro ao copiar
}

