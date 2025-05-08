export type P<T, TKey> = T extends any[] ? number | '[]' : TKey
export type V<T, TKey extends keyof T> = T extends any[] ? T[0] : Required<T[TKey]>

export interface IPathGeneratorCurry<T> {
  <K1 extends keyof T>(p1: P<T, K1>): IPathGenerator<V<T, K1>>
  <K1 extends keyof T, K2 extends keyof V<T, K1>>(p1: P<T, K1>, p2: P<V<T, K1>, K2>): IPathGenerator<V<V<T, K1>, K2>>

  <K1 extends keyof T, K2 extends keyof V<T, K1>, K3 extends keyof V<V<T, K1>, K2>>(
    p1: P<T, K1>,
    p2: P<V<T, K1>, K2>,
    p3: P<V<V<T, K1>, K2>, K3>
  ): IPathGenerator<V<V<V<T, K1>, K2>, K3>>

  <K1 extends keyof T, K2 extends keyof V<T, K1>, K3 extends keyof V<V<T, K1>, K2>, K4 extends keyof V<V<V<T, K1>, K2>, K3>>(
    p1: P<T, K1>,
    p2: P<V<T, K1>, K2>,
    p3: P<V<V<T, K1>, K2>, K3>,
    p4: P<V<V<V<T, K1>, K2>, K3>, K4>
  ): IPathGenerator<V<V<V<V<T, K1>, K2>, K3>, K4>>

  <
    K1 extends keyof T,
    K2 extends keyof V<T, K1>,
    K3 extends keyof V<V<T, K1>, K2>,
    K4 extends keyof V<V<V<T, K1>, K2>, K3>,
    K5 extends keyof V<V<V<V<T, K1>, K2>, K3>, K4>
  >(
    p1: P<T, K1>,
    p2: P<V<T, K1>, K2>,
    p3: P<V<V<T, K1>, K2>, K3>,
    p4: P<V<V<V<T, K1>, K2>, K3>, K4>,
    p5?: P<V<V<V<V<T, K1>, K2>, K3>, K4>, K5>
  ): IPathGenerator<V<V<V<V<V<T, K1>, K2>, K3>, K4>, K5>>
}

export interface IPathGenerator<T> {
  <
    K1 extends keyof T,
    K2 extends keyof V<T, K1>,
    K3 extends keyof V<V<T, K1>, K2>,
    K4 extends keyof V<V<V<T, K1>, K2>, K3>,
    K5 extends keyof V<V<V<V<T, K1>, K2>, K3>, K4>,
    K6 extends keyof V<V<V<V<V<T, K1>, K2>, K3>, K4>, K5>,
    K7 extends keyof V<V<V<V<V<V<T, K1>, K2>, K3>, K4>, K5>, K6>,
    K8 extends keyof V<V<V<V<V<V<V<T, K1>, K2>, K3>, K4>, K5>, K6>, K7>,
    K9 extends keyof V<V<V<V<V<V<V<V<T, K1>, K2>, K3>, K4>, K5>, K6>, K7>, K8>
  >(
    p1: P<T, K1>,
    p2?: P<V<T, K1>, K2>,
    p3?: P<V<V<T, K1>, K2>, K3>,
    p4?: P<V<V<V<T, K1>, K2>, K3>, K4>,
    p5?: P<V<V<V<V<T, K1>, K2>, K3>, K4>, K5>,
    p6?: P<V<V<V<V<V<T, K1>, K2>, K3>, K4>, K5>, K6>,
    p7?: P<V<V<V<V<V<V<T, K1>, K2>, K3>, K4>, K5>, K6>, K7>,
    p8?: P<V<V<V<V<V<V<V<T, K1>, K2>, K3>, K4>, K5>, K6>, K7>, K8>,
    p9?: P<V<V<V<V<V<V<V<V<T, K1>, K2>, K3>, K4>, K5>, K6>, K7>, K8>, K9>
  ): string

  carry: IPathGeneratorCurry<T>
}

export const ALL_ITEMS_SIGN = '[]' as const

export const composeName = (...args: Array<string | number>): string => {
  return args.reduce((result, step, index) => {
    return result + (typeof step === 'number' ? `[${step}]` : step === ALL_ITEMS_SIGN || index === 0 ? step : `.${step}`)
  }, '') as string
}

export const pathGenerator = <T>(obj?: T, ...prefix: Array<string | number>): IPathGenerator<Required<T>> => {
  const func = (...args: Array<string | number>): string => {
    return composeName(...prefix, ...args)
  }
  func.carry = (...args: Array<string | number>) => pathGenerator(obj, ...prefix, ...args)
  return func as any
}
