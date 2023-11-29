export function truncateString(
    text?: string,
    paddingLength = 6,
    endPadding = 0,
  ): string | undefined {
    if (!text?.length) return undefined
    if (text.length <= paddingLength * 2 + 1) return text
    return text.replace(
      text.substring(paddingLength, text.length - (endPadding || paddingLength)),
      '…',
    )
}