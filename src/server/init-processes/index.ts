import { WorkerPool } from './worker-pool'
import { InitProcessesParams } from '../types'
import {
  AIProductsListRepo,
  ICollectProductsParams,
  IFinishCollectingProductsParams,
  IParseProductsParams,
  IStartCollectingProductsParams,
  ProductsRequestRepo,
} from '../external'

const initAIProcesses = ({ eventBus }: InitProcessesParams) => {
  const parseProductsPool = new WorkerPool<IParseProductsParams, boolean>({
    taskName: 'mistral/parseProducts',
    eventBus,
  })

  eventBus.subscribe(ev => {
    if (ev.entity === ProductsRequestRepo.collectionName && ev.event.kind === 'created') {
      return parseProductsPool.runTask({ productsRequestId: ev.event.entity.id })
    }
  })
}

const initProductsCollectingProcesses = ({ eventBus }: InitProcessesParams) => {
  const startProductsCollectingPool = new WorkerPool<IStartCollectingProductsParams, boolean>({
    taskName: 'edadeal/startProductsCollecting',
    eventBus,
  })

  const collectProductsPool = new WorkerPool<ICollectProductsParams, boolean>({
    taskName: 'edadeal/collectProducts',
    eventBus,
    size: 2,
    proxyList: ['socks5h://user291075:0f3s8i@195.96.150.5:12673'],
  })

  const finishProductsCollectingPool = new WorkerPool<IFinishCollectingProductsParams, boolean>({
    taskName: 'edadeal/finishProductsCollecting',
    eventBus,
  })

  eventBus.subscribe(async ev => {
    if (ev.entity === AIProductsListRepo.collectionName && ev.event.kind === 'created') {
      const { entity } = ev.event

      await startProductsCollectingPool.runTask({
        productsRequestId: entity.productsRequestId,
      })

      const results = await Promise.all(
        entity.list.map(product => {
          return collectProductsPool.runTask({
            productsRequestId: entity.productsRequestId,
            product,
          })
        })
      )

      await finishProductsCollectingPool.runTask({
        productsRequestId: entity.productsRequestId,
        success: results.every(x => x.kind === 'success' && x.result),
      })
    }
  })
}

export const initProcesses = (params: InitProcessesParams) => {
  initAIProcesses(params)
  initProductsCollectingProcesses(params)
}
