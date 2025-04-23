export interface IParams {
  qwe: string
}

export const asd = ({ qwe }: IParams) => qwe

console.log('!!', asd({ qwe: 'qwe' }))
