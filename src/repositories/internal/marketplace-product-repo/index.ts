import { createHash } from 'node:crypto'
import { IMarketplaceProductEntity } from './types'
import { DataBaseSession, IUpdatableRepo, PriceCategory } from '../../types'
import { DataBaseUpdatableRepo, IQueryBuilder } from '../../external'

export * from './types'

export class MarketplaceProductsRepo
  extends DataBaseUpdatableRepo<IMarketplaceProductEntity>
  implements IUpdatableRepo<IMarketplaceProductEntity>
{
  static collectionName = 'marketplaceProducts' as const

  static generateHash = (cityId: string, shopId: string, productName: string, productPriceCategory: PriceCategory) => {
    const hash = createHash('md5')
    hash.update(`${cityId}:${shopId}:${productName}:${productPriceCategory}`)
    return hash.digest('hex')
  }

  constructor(dbSession: DataBaseSession) {
    super(dbSession, MarketplaceProductsRepo.collectionName)
  }

  protected queryingMiddleware = (query: IQueryBuilder<IMarketplaceProductEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: IMarketplaceProductEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: IMarketplaceProductEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: IMarketplaceProductEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
