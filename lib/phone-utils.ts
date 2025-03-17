/**
 * Formats a phone number for WhatsApp API
 * Removes any non-digit characters and adds @c.us suffix if needed
 * @param phoneNumber The phone number to format
 * @returns Formatted phone number or null if invalid
 */
export function formatPhoneNumber(phoneNumber: string): string | null {
  if (!phoneNumber) return null

  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, "")

  // Check if we have a valid number (at least 10 digits)
  if (digitsOnly.length < 10) return null

  // Ensure the number has the country code (assume Brazil/55 if not present)
  let formattedNumber = digitsOnly
  if (!formattedNumber.startsWith("55")) {
    formattedNumber = "55" + formattedNumber
  }

  // Add the WhatsApp suffix if not present
  if (!formattedNumber.includes("@c.us")) {
    formattedNumber = `${formattedNumber}@c.us`
  }

  return formattedNumber
}

/**
 * Validates if a phone number is in a valid format
 * @param phoneNumber The phone number to validate
 * @returns True if valid, false otherwise
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false

  // Simple validation - at least 10 digits
  const digitsOnly = phoneNumber.replace(/\D/g, "")
  return digitsOnly.length >= 10
}

/**
 * Remove a formatação de um número de telefone, deixando apenas os dígitos
 * @param phoneNumber Número de telefone formatado
 * @returns Apenas os dígitos do número
 */
export function cleanPhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, "")
}

