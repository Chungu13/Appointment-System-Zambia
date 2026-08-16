// Mirrors backend/core/phone.py so the customer gets told before submitting.
// The server validates again on create_booking; this is only for fast feedback,
// never the enforcement point. Keep the prefix list in step with the backend.
const ZAMBIAN_PREFIXES = ['76', '96', '57', '77', '97', '95']

export function isValidZambianPhone(phone) {
  let cleaned = String(phone ?? '').replace(/\D/g, '')
  if (cleaned.startsWith('260') && cleaned.length === 12) cleaned = cleaned.slice(3)
  else if (cleaned.startsWith('0') && cleaned.length === 10) cleaned = cleaned.slice(1)
  if (cleaned.length !== 9) return false
  return ZAMBIAN_PREFIXES.includes(cleaned.slice(0, 2))
}
