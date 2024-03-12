import { resolve } from 'node:path'
import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'
import { FileSystemIconLoader } from '@iconify/utils/lib/loader/node-loaders'

const iconDirectory = resolve(__dirname, 'src/assets/svg')

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
      collections: {
        custom: FileSystemIconLoader(iconDirectory),
      },
    }),
  ],
})
