import { WorkerPool } from './worker-pool'
import { InitProcessesParams } from '../types'
import {
  ChangeCityRequestRepo,
  finishCitiesSearching,
  finishProductsCollecting,
  finishProductsParsing,
  IAIProduct,
  ICity,
  ICollectedProduct,
  ICollectProductsParams,
  IGetChercherAreaParams,
  IParseProductsParams,
  ISearchCitiesParams,
  ProductsRequestRepo,
  startUserCityUpdating,
  startCitiesSearching,
  startProductsCollecting,
  startProductsParsing,
  finishUserCityUpdating,
} from '../external'

export const initProcesses = ({ app, eventBus }: InitProcessesParams) => {
  const { writeExecutor } = app.getExecutors({})

  const mistralWorkerPool = new WorkerPool({
    taskNames: ['mistral/parseProducts'],
    eventBus,
    taskTimeout: 1000 * 60 * 2, // 2 minutes
  })

  const edadealWorkerPool = new WorkerPool({
    taskNames: ['edadeal/collectProducts', 'edadeal/searchCities', 'edadeal/getChercherArea'],
    eventBus,
    size: 2,
    proxyList: ['socks5h://user291075:0f3s8i@195.96.150.5:12673'],
  })

  const internalWorkerPool = new WorkerPool({
    taskNames: ['internal/databaseCleanup'],
    eventBus,
  })

  // отправляем расписание крона в процесс очистки
  Promise.resolve().then(() => {
    return internalWorkerPool.runTask('internal/databaseCleanup', {
      cronExpression: process.env.DATA_BASE_CLEANUP_CRON || '0 */2 * * *', // каждые 2 часа
    })
  })

  eventBus.subscribe(async ev => {
    if (ev.entity === ChangeCityRequestRepo.collectionName) {
      if (ev.event.kind === 'created') {
        if (ev.event.entity.status === 'created') {
          const result = await edadealWorkerPool.runTask<ISearchCitiesParams, ICity[]>(
            'edadeal/searchCities',
            {
              changeCityRequestId: ev.event.entity.id,
              query: ev.event.entity.query,
            },
            {
              preTask: async params => {
                const needContinue = await writeExecutor.execute(startCitiesSearching, { changeCityRequestId: ev.event.entity.id })

                if (!needContinue) {
                  params.stopTask()
                }
              },
            }
          )

          await writeExecutor.execute(finishCitiesSearching, {
            changeCityRequestId: ev.event.entity.id,
            list: result.kind === 'success' ? result.result : undefined,
          })
        }
      }
    }
  })

  eventBus.subscribe(async ev => {
    if (ev.entity === ChangeCityRequestRepo.collectionName) {
      if (ev.event.kind === 'updated') {
        if (ev.event.entity.status === 'citySelected' && ev.event.entity.selectedCityId && !ev.event.prevEntity.selectedCityId) {
          const result = await edadealWorkerPool.runTask<IGetChercherAreaParams, string>(
            'edadeal/getChercherArea',
            {
              changeCityRequestId: ev.event.entity.id,
            },
            {
              preTask: async params => {
                const needContinue = await writeExecutor.execute(startUserCityUpdating, { changeCityRequestId: ev.event.entity.id })

                if (!needContinue) {
                  params.stopTask()
                }
              },
            }
          )

          await writeExecutor.execute(finishUserCityUpdating, {
            changeCityRequestId: ev.event.entity.id,
            chercherArea: result.kind === 'success' ? result.result : undefined,
          })
        }
      }
    }
  })

  eventBus.subscribe(async ev => {
    if (ev.entity === ProductsRequestRepo.collectionName) {
      if (ev.event.kind === 'created') {
        if (ev.event.entity.status === 'created') {
          const result = await mistralWorkerPool.runTask<IParseProductsParams, IAIProduct[]>(
            'mistral/parseProducts',
            {
              productsRequestId: ev.event.entity.id,
            },
            {
              preTask: async params => {
                const needContinue = await writeExecutor.execute(startProductsParsing, { productsRequestId: ev.event.entity.id })

                if (!needContinue) {
                  params.stopTask()
                }
              },
            }
          )

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
        if (ev.event.entity.status === 'productsParsed' && ev.event.prevEntity.status === 'productsParsing') {
          const needContinue = await writeExecutor.execute(startProductsCollecting, { productsRequestId: ev.event.entity.id })

          if (!needContinue) {
            return
          }

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
