/**
 * Clean and sanitize AI response text.
 * Strips raw markdown hashes (###, ##), bold asterisks (**), stray symbols (@),
 * and decorative emojis, returning clean, readable text in a proper order.
 */

// Comprehensive regex to match unicode emojis
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu;

export function sanitizeAiText(input: string): string {
  if (!input) return '';

  return input
    // 1. Remove all unicode emojis
    .replace(EMOJI_REGEX, '')
    // 2. Strip leading markdown headers (### Header -> Header)
    .replace(/^#{1,6}\s+/gm, '')
    // 3. Strip bold / italic markdown (**text** -> text, __text__ -> text, *text* -> text)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, '$1')
    // 4. Remove compound symbols like ##@**, ##, @@, **, etc.
    .replace(/[#*@]{2,}/g, '')
    // 5. Remove stray @ or # prefixes at line start
    .replace(/^[@#*]\s*/gm, '')
    .replace(/\s+[@#]\s+/g, ' ')
    // 6. Clean multiple spaces within lines
    .replace(/[ \t]+/g, ' ')
    // 7. Remove excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

