<script lang="ts">
import { defineComponent, h, ref } from 'vue'
import { getDataTableConfig } from '../config'

/**
 * 溢出隐藏恒开启；tooltip 为 true 时才在 hover 那一刻做一次溢出测量，
 * 避免旧实现里逐格提前测量的开销。
 */
export default defineComponent({
  name: 'EllipsisText',
  props: {
    text: { type: String, required: true },
    tooltip: { type: Boolean, default: false },
  },
  setup(props) {
    const contentRef = ref<HTMLElement>()
    const overflowing = ref(false)

    function detect() {
      if (!props.tooltip || !contentRef.value) {
        return
      }
      overflowing.value = contentRef.value.scrollWidth > contentRef.value.clientWidth
    }

    return () => {
      const tooltipComponent = getDataTableConfig().tooltip
      const useComponentTooltip = props.tooltip && Boolean(tooltipComponent)
      const content = h(
        'span',
        {
          ref: contentRef,
          class: 'dt-ellipsis',
          onMouseenter: detect,
          title:
            !useComponentTooltip && props.tooltip && overflowing.value
              ? props.text
              : undefined,
        },
        props.text,
      )

      // 结构不随 hover 变化（只切 title），否则 hover 中重挂载会立刻收起 tooltip
      return useComponentTooltip
        ? h(
            tooltipComponent!,
            { title: overflowing.value ? props.text : '' },
            { default: () => content },
          )
        : content
    }
  },
})
</script>
