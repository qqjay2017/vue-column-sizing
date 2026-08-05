import { defineValueType } from '../registry'

export const dateValueType = defineValueType({
  format: (value, ctx) => ctx.config.format.date(value),
})

export const monthValueType = defineValueType({
  format: (value, ctx) => ctx.config.format.month(value),
})

/**
 * 存量语义：'time' 就是「日期 + 时间」，不是「仅时间」。
 * 402 处存量用法依赖这一点，不能改。'datetime' 是给新代码的语义化别名。
 */
export const timeValueType = defineValueType({
  format: (value, ctx) => ctx.config.format.time(value),
})
