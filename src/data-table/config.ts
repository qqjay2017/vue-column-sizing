import type { Component } from 'vue'

export interface DictSource {
  /** 返回 undefined 表示未命中，由管线回落到原始值 */
  getLabel: (code: string, itemValue: string | number) => string | undefined
}

export interface MoneyFormatOptions {
  centsToYuan?: boolean
  decimals?: number
  symbol?: boolean
}

/** 返回 undefined 表示无可展示文本，由管线回落到 emptyText */
export interface ValueFormatters {
  date: (value: unknown) => string | undefined
  month: (value: unknown) => string | undefined
  time: (value: unknown) => string | undefined
  money: (value: unknown, options: MoneyFormatOptions) => string | undefined
}

export interface DataTableConfig {
  emptyText: string
  dict: DictSource
  format: ValueFormatters
  /** 溢出提示用的 tooltip 组件，生产环境注入 ant-design-vue 的 Tooltip */
  tooltip?: Component
}

const DATE_PARTS = /^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value === 'number') {
    const fromTimestamp = new Date(value)
    return Number.isNaN(fromTimestamp.getTime()) ? null : fromTimestamp
  }
  if (typeof value !== 'string') {
    return null
  }
  // 后端主流格式按分量手工构造，避免 'YYYY-MM-DD' 被当成 UTC 午夜而跨时区偏移一天
  const matched = DATE_PARTS.exec(value.trim())
  if (matched) {
    const [, year, month, day, hour, minute, second] = matched
    return new Date(
      Number(year),
      Number(month) - 1,
      day ? Number(day) : 1,
      hour ? Number(hour) : 0,
      minute ? Number(minute) : 0,
      second ? Number(second) : 0,
    )
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function withThousandSeparator(fixed: string): string {
  const [integer, fraction] = fixed.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fraction ? `${grouped}.${fraction}` : grouped
}

/**
 * 默认格式化实现，不依赖 dayjs，够原型使用。
 * 搬进 battery-vue-ui 时用 setDataTableConfig 替换为 utils/timefn + utils/amount。
 */
const defaultFormatters: ValueFormatters = {
  date(value) {
    const date = toDate(value)
    // 解析不了就回落原始字符串，与旧 dateValueFormat 的行为一致
    return date
      ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
      : String(value)
  },
  month(value) {
    const date = toDate(value)
    return date
      ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
      : String(value)
  },
  time(value) {
    const date = toDate(value)
    if (!date) {
      return String(value)
    }
    const day = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
    return `${day} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
  },
  money(value, { centsToYuan = false, decimals = 2, symbol = false } = {}) {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) {
      return undefined
    }
    const yuan = centsToYuan ? numeric / 100 : numeric
    const text = withThousandSeparator(yuan.toFixed(decimals))
    return symbol ? `¥${text}` : text
  },
}

const config: DataTableConfig = {
  emptyText: '-',
  dict: {
    getLabel: () => undefined,
  },
  format: defaultFormatters,
}

export function setDataTableConfig(patch: {
  emptyText?: string
  dict?: Partial<DictSource>
  format?: Partial<ValueFormatters>
  tooltip?: Component
}): void {
  if (patch.emptyText !== undefined) {
    config.emptyText = patch.emptyText
  }
  if (patch.tooltip !== undefined) {
    config.tooltip = patch.tooltip
  }
  if (patch.dict) {
    config.dict = { ...config.dict, ...patch.dict }
  }
  if (patch.format) {
    config.format = { ...config.format, ...patch.format }
  }
}

export function getDataTableConfig(): DataTableConfig {
  return config
}
