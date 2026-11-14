import { describe, it, expect } from 'vitest'
import {
  canEnableDisclaimerAccept,
  isScrolledToBottom,
  type ScrollMetrics,
} from '../../src/lib/disclaimer-scroll'

describe('disclaimer scroll helpers', () => {
  it('isScrolledToBottom when within threshold', () => {
    const el: ScrollMetrics = { scrollTop: 98, scrollHeight: 200, clientHeight: 100 }
    expect(isScrolledToBottom(el)).toBe(true)
  })

  it('isScrolledToBottom false when not at end', () => {
    const el: ScrollMetrics = { scrollTop: 0, scrollHeight: 200, clientHeight: 100 }
    expect(isScrolledToBottom(el)).toBe(false)
  })

  it('canEnableDisclaimerAccept when no overflow', () => {
    const el: ScrollMetrics = { scrollTop: 0, scrollHeight: 80, clientHeight: 100 }
    expect(canEnableDisclaimerAccept(el)).toBe(true)
  })

  it('canEnableDisclaimerAccept when scrolled to bottom', () => {
    const el: ScrollMetrics = { scrollTop: 100, scrollHeight: 200, clientHeight: 100 }
    expect(canEnableDisclaimerAccept(el)).toBe(true)
  })
})