// Lista de palavras e frases proibidas
// Adicione ou remova conforme necessário
export const BANNED_WORDS: string[] = [
  // Exemplos — substitua pela sua lista real
  'palavrão1',
  'palavrão2',
  'frase proibida completa',
  'xingamento grave',
]

// Normaliza o texto para comparação (remove acentos, lowercase)
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export interface MatchResult {
  found: true
  word: string
  normalized: string
}

export interface NoMatchResult {
  found: false
}

export type CheckResult = MatchResult | NoMatchResult

export function checkBannedWords(text: string): CheckResult {
  const normalizedText = normalize(text)

  for (const word of BANNED_WORDS) {
    const normalizedWord = normalize(word)
    if (normalizedText.includes(normalizedWord)) {
      return { found: true, word, normalized: normalizedWord }
    }
  }

  return { found: false }
}
