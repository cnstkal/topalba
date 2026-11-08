import { mkdir, writeFile } from 'node:fs/promises'

const version = process.env.GITHUB_SHA?.slice(0, 12) || Date.now().toString(36)
const publicDir = new URL('../public/', import.meta.url)

await mkdir(publicDir, { recursive: true })
await writeFile(new URL('version.json', publicDir), JSON.stringify({ version }) + '\n')
console.log(`Wrote deployment version: ${version}`)
