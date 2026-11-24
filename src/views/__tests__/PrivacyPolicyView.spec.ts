import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PrivacyPolicyView from '@/views/PrivacyPolicyView.vue'

describe('PrivacyPolicyView (politique de confidentialité)', () => {
  it("cite les navigateurs de l'extension sans nommer Edge ni Brave", () => {
    const texte = mount(PrivacyPolicyView, { global: { stubs: { RouterLink: true } } }).text()

    expect(texte).not.toMatch(/edge|brave/i)
    expect(texte).toContain('Firefox, Chrome et les autres navigateurs basés sur Chromium')
  })
})
