export interface IRuVariants {
  '0': string
  '1'?: string
  '2'?: string
}

export const ruVariants = (count: number, variants: IRuVariants) => {
  if (variants[1] !== undefined && count % 10 === 1 && count % 100 !== 11) {
    return variants[1]
  }
  if (variants[2] !== undefined && count % 10 > 1 && count % 10 < 5 && !(count % 100 > 11 && count % 100 < 15)) {
    return variants[2]
  }
  return variants[0]
}
