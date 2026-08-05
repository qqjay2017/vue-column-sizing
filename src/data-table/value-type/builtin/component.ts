import { h } from 'vue'
import { defineValueType } from '../registry'

export interface TagOptions {
  /** 值 → 颜色，缺省用默认灰 */
  colorMap?: Record<string, string>
  defaultColor?: string
}

/**
 * 自定义组件值的最小示例：产出 VNode 而非字符串。
 * 需要「字典文案 + 标签外观」时不要给 tag 再塞一份字典逻辑，
 * 而是用 valueType: 'dict' + cellRender 组合，参见 demo。
 */
export const tagValueType = defineValueType<TagOptions>({
  render(value, ctx, { colorMap, defaultColor = '#8c8c8c' } = {}) {
    const color = colorMap?.[String(value)] ?? defaultColor
    return h(
      'span',
      { class: 'dt-tag', style: { color, borderColor: color } },
      ctx.text,
    )
  },
})

export interface LinkOptions {
  href?: (value: unknown, record: any) => string
  onClick?: (value: unknown, record: any) => void
}

export const linkValueType = defineValueType<LinkOptions>({
  render(value, ctx, { href, onClick } = {}) {
    return h(
      'a',
      {
        class: 'dt-link',
        href: href ? href(value, ctx.record) : undefined,
        onClick: onClick
          ? (event: MouseEvent) => {
              event.preventDefault()
              onClick(value, ctx.record)
            }
          : undefined,
      },
      ctx.text,
    )
  },
})
