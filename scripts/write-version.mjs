import { writeFile } from 'node:fs/promises'

const version = `mw7r5zqv`
await writeFile(new URL('../public/version.json', import.meta.url), JSON.stringify({ version }) + '\n')
console.log(`Wrote deployment version: ${version}`)
