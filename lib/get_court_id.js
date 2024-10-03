export function GetCourtId(block_number) {
  return block_number.charCodeAt(0) - 96;
}
