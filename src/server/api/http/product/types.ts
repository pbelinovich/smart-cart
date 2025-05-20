export interface IAbsentProductDto {
  id: string
  createDate: string
  quantity: string
  cityId: string
  shopId: string
  queryName: string
}

export interface IPresentProductDto extends IAbsentProductDto {
  productName: string
  productPrice: number
}

export interface IProductsResult {
  present: IPresentProductDto[]
  absent: IAbsentProductDto[]
}
