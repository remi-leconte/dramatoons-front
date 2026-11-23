// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

async function versionInscrite(): Promise<unknown> {
  vi.resetModules()
  const { default: config } = await import('../../vite.config')
  return config.define?.__APP_VERSION__
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('vite.config (version inscrite à la construction)', () => {
  it('inscrit la version passée par APP_VERSION', async () => {
    vi.stubEnv('APP_VERSION', 'v9.9.9')

    expect(await versionInscrite()).toBe('"v9.9.9"')
  })

  it('inscrit dev si APP_VERSION est vide', async () => {
    vi.stubEnv('APP_VERSION', '')

    expect(await versionInscrite()).toBe('"dev"')
  })
})
