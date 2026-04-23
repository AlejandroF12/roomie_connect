// Feature: roomie-connect, Property 16: Generación de enlace WhatsApp contiene el número

import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'

// Mock Supabase so the module can be imported without env vars.
// generateWhatsAppLink is a pure function and never calls Supabase.
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { contactService } from '../contact.service'

/**
 * Validates: Requirements 10.2
 *
 * Property 16: For any valid phone number registered in an owner's profile,
 * the WhatsApp link generator SHALL produce a URL that contains that phone
 * number (after cleaning non-digit/non-plus characters) as part of the path
 * or query string.
 *
 * The `generateWhatsAppLink` function:
 *   1. Strips all characters except digits and `+` from the phone.
 *   2. Builds the URL: `https://wa.me/{cleanPhone}?text={encodedMessage}`
 *
 * We verify:
 *   - The generated URL contains the cleaned phone number in the path.
 *   - The URL starts with `https://wa.me/`.
 *   - The URL includes the encoded message as a query parameter.
 */

// ─── Unit examples ────────────────────────────────────────────────────────────

describe('contactService.generateWhatsAppLink — unit examples', () => {
  it('generates a URL that starts with https://wa.me/', () => {
    const url = contactService.generateWhatsAppLink('+34612345678')
    expect(url).toMatch(/^https:\/\/wa\.me\//)
  })

  it('includes the cleaned phone number in the URL path', () => {
    const phone = '+34612345678'
    const url = contactService.generateWhatsAppLink(phone)
    expect(url).toContain('+34612345678')
  })

  it('strips non-digit/non-plus characters from the phone before building the URL', () => {
    const url = contactService.generateWhatsAppLink('+34 612-345-678')
    // Spaces and dashes are removed; only digits and + remain
    expect(url).toContain('+34612345678')
  })

  it('encodes the default message as a query parameter', () => {
    const url = contactService.generateWhatsAppLink('+34612345678')
    expect(url).toContain('?text=')
    // The default message should be URL-encoded
    expect(url).toContain(encodeURIComponent('¡Hola! Vi tu publicación en Roomie Connect y me interesa.'))
  })

  it('uses a custom message when provided', () => {
    const message = 'Hola, me interesa tu habitación'
    const url = contactService.generateWhatsAppLink('+34612345678', message)
    expect(url).toContain(encodeURIComponent(message))
  })

  it('produces the exact expected URL format for a clean phone number', () => {
    const phone = '+34612345678'
    const message = 'Hola'
    const url = contactService.generateWhatsAppLink(phone, message)
    expect(url).toBe(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`)
  })

  it('handles a phone number with only digits (no plus sign)', () => {
    const phone = '34612345678'
    const url = contactService.generateWhatsAppLink(phone)
    expect(url).toContain(phone)
    expect(url).toMatch(/^https:\/\/wa\.me\//)
  })
})

// ─── Property 16: Generación de enlace WhatsApp contiene el número ────────────

describe('Property 16: Generación de enlace WhatsApp contiene el número', () => {
  it(
    'Property 16: for any valid phone number, generateWhatsAppLink SHALL produce ' +
      'a URL that contains the cleaned phone number as part of the path',
    () => {
      fc.assert(
        fc.property(
          // Generate phone numbers: non-empty strings with at least one non-whitespace character
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
          (phone) => {
            const url = contactService.generateWhatsAppLink(phone)

            // Compute the cleaned phone as the function does internally
            const cleanPhone = phone.replace(/[^\d+]/g, '')

            // Property 16a: the URL must start with the WhatsApp base URL
            if (!url.startsWith('https://wa.me/')) return false

            // Property 16b: if the cleaned phone is non-empty, it must appear in the URL
            if (cleanPhone.length > 0) {
              if (!url.includes(cleanPhone)) return false
            }

            // Property 16c: the URL must contain the text query parameter
            if (!url.includes('?text=')) return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'Property 16 (URL structure): for any phone number, the generated URL SHALL ' +
      'always follow the pattern https://wa.me/{phone}?text={message}',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          (phone, message) => {
            const url = contactService.generateWhatsAppLink(phone, message)
            const cleanPhone = phone.replace(/[^\d+]/g, '')
            const expectedUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

            return url === expectedUrl
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
