export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const random = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
