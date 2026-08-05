import { toValue } from 'vue'
import type { DataTableConfig } from '../../config'
import type { DictSpec } from '../../interface'
import { isEmptyValue } from '../empty'
import { defineValueType } from '../registry'

export interface DictOptions {
  dict?: DictSpec
  /** 多值分隔符，默认 ','。数组值无需配置即支持 */
  separator?: string
}

function resolveLabel(
  dict: DictSpec,
  itemValue: string | number,
  config: DataTableConfig,
): string {
  const resolved = toValue(dict)
  if (typeof resolved === 'string') {
    return config.dict.getLabel(resolved, itemValue) ?? String(itemValue)
  }
  if (Array.isArray(resolved)) {
    // 宽松比较：后端字典 code 常在 number 与 string 之间漂移
    const hit = resolved.find((item) => String(item.value) === String(itemValue))
    return hit ? hit.label : String(itemValue)
  }
  return String(itemValue)
}

export const dictValueType = defineValueType<DictOptions>({
  format(value, ctx, { dict, separator = ',' } = {}) {
    if (dict === undefined) {
      return undefined
    }
    const items = Array.isArray(value)
      ? value
      : typeof value === 'string' && value.includes(separator)
        ? value.split(separator)
        : [value]

    const labels = items
      .map((item) => (typeof item === 'string' ? item.trim() : item))
      .filter((item) => !isEmptyValue(item))
      .map((item) => resolveLabel(dict, item as string | number, ctx.config))

    return labels.length > 0 ? labels.join(separator) : undefined
  },
})
