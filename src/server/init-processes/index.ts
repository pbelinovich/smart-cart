import { WorkerPool } from './worker-pool'
import { InitProcessesParams } from '../types'
import {
  AIProductsListRepo,
  IFetchEdadealProductsParams,
  IFinishFetchEdadealProductsParams,
  IParseProductsParams,
  ProductsRequestRepo,
} from '../external'

const initAIProcesses = ({ eventBus }: InitProcessesParams) => {
  const parseProductsProcessesPool = new WorkerPool<IParseProductsParams, boolean>('parseProducts', {
    eventBus,
  })

  eventBus.subscribe(ev => {
    if (ev.entity === ProductsRequestRepo.collectionName && ev.event.kind === 'created') {
      return parseProductsProcessesPool.runTask({ productsRequestId: ev.event.entity.id })
    }
  })
}

const initEdadealProcesses = ({ eventBus }: InitProcessesParams) => {
  const edadealProcessesPool = new WorkerPool<IFetchEdadealProductsParams, boolean>('fetchEdadealProducts', {
    eventBus,
    size: 2,
    proxyList: ['socks5h://user291075:0f3s8i@195.96.150.5:12673'],
  })

  const finishEdadealProcessesPool = new WorkerPool<IFinishFetchEdadealProductsParams, boolean>('finishFetchEdadealProducts', {
    eventBus,
  })

  eventBus.subscribe(async ev => {
    if (ev.entity === AIProductsListRepo.collectionName && ev.event.kind === 'created') {
      const { entity } = ev.event

      const results = await Promise.all(
        entity.list.map(product => {
          return edadealProcessesPool.runTask({
            productsRequestId: entity.productsRequestId,
            product,
          })
        })
      )

      await finishEdadealProcessesPool.runTask({
        productsRequestId: entity.productsRequestId,
        success: results.every(x => x.kind === 'success' && x.result),
      })
    }
  })
}

export const initProcesses = (params: InitProcessesParams) => {
  initAIProcesses(params)
  initEdadealProcesses(params)
}
