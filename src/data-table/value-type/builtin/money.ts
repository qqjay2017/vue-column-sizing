import type { MoneyFormatOptions } from '../../config'
import { defineValueType } from '../registry'

export const moneyValueType = defineValueType<MoneyFormatOptions>({
  align: 'right',
  cellClass: 'dt-money',
  format: (value, ctx, options = {}) => ctx.config.format.money(value, options),
})

export interface PercentOptions {
  decimals?: number
}

export const percentValueType = defineValueType<PercentOptions>({
  align: 'right',
  format(value, _ctx, { decimals = 2 } = {}) {
    const numeric = Number(value)
    return Number.isNaN(numeric) ? undefined : `${numeric.toFixed(decimals)}%`
  },
})
