export const truncateHash = (
  hash: string | undefined,
  paddingLength = 6,
  endPadding = 0,
): string | undefined => {
  if (!hash?.length) return undefined
  if (hash.length <= paddingLength * 2 + 1) return hash
  return hash.replace(
    hash.substring(paddingLength, hash.length - (endPadding || paddingLength)),
    '…',
  )
}
