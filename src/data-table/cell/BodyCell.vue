<script lang="ts">
import { defineComponent, h } from 'vue'
import type { PropType, VNodeChild } from 'vue'
import type { NormalizedColumn, RowCellProps } from '../interface'
import { resolveCellDisplay } from '../value-type/resolve'
import EllipsisText from './EllipsisText.vue'

export type CellSlotFn = (
  props: RowCellProps & { dictLabel: string },
) => VNodeChild

/** 函数通道返回纯文本时，与内置文本通道享受同一套溢出省略与 hover tooltip */
function wrapText(result: VNodeChild, tooltip: boolean): VNodeChild {
  return typeof result === 'string' || typeof result === 'number'
    ? h(EllipsisText, { text: String(result), tooltip })
    : result
}

/**
 * 单元格渲染优先级：
 * 具名插槽 > cellRender > legacy customRender > valueType.render > valueType.format
 */
export default defineComponent({
  name: 'BodyCell',
  props: {
    column: { type: Object as PropType<NormalizedColumn>, required: true },
    record: { type: null as unknown as PropType<any>, required: true },
    index: { type: Number, required: true },
    emptyText: { type: String, default: undefined },
    slotFn: { type: Function as PropType<CellSlotFn>, default: undefined },
  },
  setup(props) {
    return () => {
      const { column } = props
      const display = resolveCellDisplay(
        column,
        props.record,
        props.index,
        props.emptyText,
      )

      const row: RowCellProps = {
        record: props.record,
        column: column.source,
        text: display.text,
        value: display.raw,
        index: props.index,
        renderIndex: props.index,
      }

      if (props.slotFn) {
        return props.slotFn({ ...row, dictLabel: display.text })
      }
      if (column.cellRender) {
        return wrapText(
          column.cellRender({
            text: display.text,
            value: display.raw,
            record: props.record,
            index: props.index,
            column: column.source,
          }),
          column.ellipsisTooltip,
        )
      }
      if (column.customRender) {
        return wrapText(column.customRender(row), column.ellipsisTooltip)
      }
      if (display.node !== undefined) {
        return display.node
      }
      return h(EllipsisText, { text: display.text, tooltip: column.ellipsisTooltip })
    }
  },
})
</script>
