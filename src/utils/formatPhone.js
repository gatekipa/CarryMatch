/**
 * Shared phone-number formatting utility.
 *
 * PHONE_FORMATS maps phone-code → format string where `#` = digit
 * and any other character (space, dash) is inserted literally.
 *
 * Usage:
 *   formatPhone("3034335857", "+1")   → "303 433 5857"
 *   formatPhone("698112233", "+237")  → "69 81 12 33"
 *   stripPhone("303-433-5857")        → "3034335857"
 */

export const PHONE_FORMATS = {
  "+1":   "###-###-####",      // US / CA
  "+237": "##-##-##-##",       // Cameroon
  "+234": "###-###-####",      // Nigeria
  "+233": "##-###-####",       // Ghana
  "+254": "###-######",        // Kenya
  "+27":  "##-###-####",       // South Africa
  "+33":  "#-##-##-##-##",     // France
  "+44":  "####-######",       // UK
  "+49":  "###-#######",       // Germany
  "+39":  "###-###-####",      // Italy
  "+34":  "###-##-##-##",      // Spain
  "+86":  "###-####-####",     // China
  "+91":  "#####-#####",       // India
  "+81":  "##-####-####",      // Japan
  "+55":  "##-#####-####",     // Brazil
  "+52":  "##-####-####",      // Mexico
  "+971": "##-###-####",       // UAE
  "+966": "##-###-####",       // Saudi Arabia
  "+221": "##-###-##-##",      // Senegal
  "+225": "##-##-##-##-##",    // Côte d'Ivoire
  "+250": "###-###-###",       // Rwanda
  "+256": "###-######",        // Uganda
  "+255": "###-###-###",       // Tanzania
  "+251": "##-###-####",       // Ethiopia
};

/**
 * Format a raw digit string with dashes according to the country's phone format.
 * Falls back to groups of 3 if no format is found.
 *
 * @param {string} raw    - raw digits (non-digits are stripped automatically)
 * @param {string} code   - phone country code e.g. "+237"
 * @returns {string}        formatted string e.g. "69-81-12-33"
 */
export function formatPhone(raw, code) {
  const digits = (raw || "").replace(/\D/g, "");
  const fmt = PHONE_FORMATS[code];

  if (!fmt) {
    // Fallback: groups of three separated by dashes
    return digits.replace(/(\d{3})(?=\d)/g, "$1-");
  }

  let result = "";
  let di = 0;
  for (let i = 0; i < fmt.length && di < digits.length; i++) {
    if (fmt[i] === "#") {
      result += digits[di++];
    } else {
      result += fmt[i];
    }
  }
  return result;
}

/**
 * Strip all non-digit characters from a phone string.
 * Useful before saving to DB or sending to API.
 */
export function stripPhone(formatted) {
  return (formatted || "").replace(/\D/g, "");
}
