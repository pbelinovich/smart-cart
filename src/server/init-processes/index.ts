import { WorkerPool } from './worker-pool'
import { InitProcessesParams } from '../types'
import {
  AIProductsListRepo,
  finishProductsCollecting,
  finishProductsParsing,
  IAIProduct,
  ICollectProductsParams,
  IParseProductsParams,
  ProductsRequestRepo,
  startProductsCollecting,
  startProductsParsing,
  updateProductsRequest,
} from '../external'

export const initProcesses = ({ app, eventBus }: InitProcessesParams) => {
  const { writeExecutor } = app.getExecutors({})

  const mistralWorkerPool = new WorkerPool<IParseProductsParams, IAIProduct[] | undefined>({
    taskName: 'mistral/parseProducts',
    eventBus,
    taskTimeout: 1000 * 60 * 2, // 2 minutes
  })

  const edadealWorkerPool = new WorkerPool<ICollectProductsParams, boolean>({
    taskName: 'edadeal/collectProducts',
    eventBus,
    size: 2,
    proxyList: ['socks5h://user291075:0f3s8i@195.96.150.5:12673'],
  })

  return eventBus.subscribe(async ev => {
    if (ev.entity === ProductsRequestRepo.collectionName) {
      if (ev.event.kind === 'created') {
        if (ev.event.entity.status === 'created') {
          return writeExecutor.execute(startProductsParsing, { productsRequestId: ev.event.entity.id })
        }
      }

      if (ev.event.kind === 'updated') {
        if (ev.event.entity.status === 'startProductsParsing' && ev.event.prevEntity.status === 'created') {
          await writeExecutor.execute(updateProductsRequest, { id: ev.event.entity.id, status: 'productsParsing' })

          const result = await mistralWorkerPool.runTask({ productsRequestId: ev.event.entity.id })

          return writeExecutor.execute(finishProductsParsing, {
            productsRequestId: ev.event.entity.id,
            list: result.kind === 'success' ? result.result : undefined,
          })
        }
      }
    }

    if (ev.entity === AIProductsListRepo.collectionName) {
      if (ev.event.kind === 'created') {
        await writeExecutor.execute(startProductsCollecting, { productsRequestId: ev.event.entity.productsRequestId })
        await writeExecutor.execute(updateProductsRequest, {
          id: ev.event.entity.productsRequestId,
          status: 'productsCollecting',
        })

        const results = await Promise.all(
          ev.event.entity.list.map(product => {
            return edadealWorkerPool.runTask({ productsRequestId: ev.event.entity.productsRequestId, product })
          })
        )

        return writeExecutor.execute(finishProductsCollecting, {
          productsRequestId: ev.event.entity.productsRequestId,
          success: results.every(x => x.kind === 'success' && x.result),
        })
      }
    }
  })
}
