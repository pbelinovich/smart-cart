import { IEntity } from '../../external'
import { ICoordinates } from '../../types'

export interface ICityEntity extends IEntity {
  name: string
  slug: string
  region: string
  coordinates: ICoordinates
  chercherArea: string
}
