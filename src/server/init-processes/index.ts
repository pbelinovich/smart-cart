import { WorkerPool } from './worker-pool'
import { InitProcessesParams } from '../types'
import {
  finishProductsCollecting,
  finishProductsParsing,
  IAIProduct,
  ICollectedProduct,
  ICollectProductsParams,
  IParseProductsParams,
  ProductsRequestRepo,
  startProductsCollecting,
  startProductsParsing,
} from '../external'

export const initProcesses = ({ app, eventBus }: InitProcessesParams) => {
  const { writeExecutor } = app.getExecutors({})

  const mistralWorkerPool = new WorkerPool({
    taskNames: ['mistral/parseProducts'],
    eventBus,
    taskTimeout: 1000 * 60 * 2, // 2 minutes
  })

  const edadealWorkerPool = new WorkerPool({
    taskNames: ['edadeal/collectProducts'],
    eventBus,
    size: 2,
    proxyList: ['socks5h://user291075:0f3s8i@195.96.150.5:12673'],
  })

  eventBus.subscribe(async ev => {
    if (ev.entity === ProductsRequestRepo.collectionName) {
      if (ev.event.kind === 'created') {
        if (ev.event.entity.status === 'created') {
          await writeExecutor.execute(startProductsParsing, { productsRequestId: ev.event.entity.id })

          const result = await mistralWorkerPool.runTask<IParseProductsParams, IAIProduct[]>('mistral/parseProducts', {
            productsRequestId: ev.event.entity.id,
          })

          await writeExecutor.execute(finishProductsParsing, {
            productsRequestId: ev.event.entity.id,
            list: result.kind === 'success' ? result.result : undefined,
          })
        }
      }
    }
  })

  eventBus.subscribe(async ev => {
    if (ev.entity === ProductsRequestRepo.collectionName) {
      if (ev.event.kind === 'updated') {
        if (ev.event.entity.status === 'finishProductsParsing' && ev.event.prevEntity.status === 'productsParsing') {
          await writeExecutor.execute(startProductsCollecting, { productsRequestId: ev.event.entity.id })

          const results = await Promise.all(
            ev.event.entity.aiProducts.map(product => {
              return edadealWorkerPool.runTask<ICollectProductsParams, ICollectedProduct[]>('edadeal/collectProducts', {
                productsRequestId: ev.event.entity.id,
                product,
              })
            })
          )

          await writeExecutor.execute(finishProductsCollecting, {
            productsRequestId: ev.event.entity.id,
            collectedProducts: results.reduce<ICollectedProduct[]>((acc, result) => {
              if (result.kind === 'success' && result.result) {
                acc.push(...result.result)
              }
              return acc
            }, []),
          })
        }
      }
    }
  })
}
