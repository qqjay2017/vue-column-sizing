import { defineValueType, registerValueType } from '../registry'
import { linkValueType, tagValueType } from './component'
import { dateValueType, monthValueType, timeValueType } from './datetime'
import { dictValueType } from './dict'
import { moneyValueType, percentValueType } from './money'

/** 默认类型，只做空值兜底 */
const textValueType = defineValueType({})

/** 序号列：不取字段值，直接用行下标 */
const indexValueType = defineValueType({
  align: 'left',
  defaultWidth: 88,
  allowEmpty: true,
  format: (_value, ctx) => String((ctx.index ?? 0) + 1),
})

registerValueType('text', textValueType)
registerValueType('index', indexValueType)
registerValueType('dict', dictValueType)
registerValueType('date', dateValueType)
registerValueType('month', monthValueType)
registerValueType('time', timeValueType)
registerValueType('datetime', timeValueType)
registerValueType('money', moneyValueType)
registerValueType('percent', percentValueType)
registerValueType('tag', tagValueType)
registerValueType('link', linkValueType)

export type { DictOptions } from './dict'
export type { PercentOptions } from './money'
export type { LinkOptions, TagOptions } from './component'
