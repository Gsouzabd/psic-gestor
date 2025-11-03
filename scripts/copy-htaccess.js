import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'

const source = '.htaccess'
const dest = join('dist', '.htaccess')

if (existsSync(source)) {
  copyFileSync(source, dest)
  console.log('✓ .htaccess copiado para dist/')
} else {
  console.warn('⚠ .htaccess não encontrado na raiz do projeto')
}


