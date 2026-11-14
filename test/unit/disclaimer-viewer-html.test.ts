import { describe, it, expect } from 'vitest'
import {
  DISCLAIMER_SCROLL_BODY_CLASS,
  DISCLAIMER_SCROLL_BODY_ID,
  renderDisclaimerScrollRegion,
} from '../../src/lib/disclaimer'

describe('disclaimer viewer markup', () => {
  it('renders scroll region with stable id and class', () => {
    const html = renderDisclaimerScrollRegion('gate')
    expect(html).toContain(`id="${DISCLAIMER_SCROLL_BODY_ID}"`)
    expect(html).toContain(DISCLAIMER_SCROLL_BODY_CLASS)
    expect(html).toContain('viewer-disclaimer-scroll--gate')
    expect(html).toContain('<ol class="ui-text-body">')
  })
})