<script lang="ts">
import { computed, defineComponent, h } from 'vue'
import type { PropType } from 'vue'
import type { ValueTypeName } from '../interface'
import { resolveValueDisplay } from '../value-type/format'
import EllipsisText from './EllipsisText.vue'

/**
 * 脱离表格复用值渲染管线的组件形态。
 * 与表格单元格同源（都走 resolveValueDisplay），并自带该类型声明的样式类。
 */
export default defineComponent({
  name: 'ValueCell',
  props: {
    type: { type: String as PropType<ValueTypeName>, default: 'text' },
    value: { type: null as unknown as PropType<any>, default: undefined },
    /** 传给 valueType 的选项，如 money 的 centsToYuan、dict 的 dict */
    options: { type: Object as PropType<Record<string, any>>, default: undefined },
    /** 依赖行上下文的类型（如 index）才需要 */
    record: { type: null as unknown as PropType<any>, default: undefined },
    index: { type: Number, default: undefined },
    emptyText: { type: String, default: undefined },
    /** 溢出省略 + hover tooltip */
    ellipsis: { type: Boolean, default: false },
  },
  setup(props) {
    const display = computed(() =>
      resolveValueDisplay(props.type, props.value, props.options, {
        record: props.record,
        index: props.index,
        emptyText: props.emptyText,
      }),
    )

    return () => {
      const { text, node, cellClass } = display.value
      const children =
        node ??
        (props.ellipsis ? h(EllipsisText, { text, tooltip: true }) : text)
      return cellClass ? h('span', { class: cellClass }, children) : children
    }
  },
})
</script>
