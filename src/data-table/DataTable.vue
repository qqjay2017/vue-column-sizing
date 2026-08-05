<script setup lang="ts" generic="TRecord extends Record<string, any>">
import { computed } from 'vue'
import type { DataTableColumn, DataTablePagination, RowCellProps } from './interface'
import { getColumnModel, useDataTable } from './useDataTable'
import type { DataTableColumnInstance } from './useDataTable'
import BodyCell from './cell/BodyCell.vue'
import type { CellSlotFn } from './cell/BodyCell.vue'

const props = withDefaults(
  defineProps<{
    columns: Array<DataTableColumn<TRecord>>
    dataSource?: Array<TRecord>
    loading?: boolean
    rowKey?: string | ((record: TRecord, index: number) => string | number)
    showIndex?: boolean
    emptyText?: string
    total?: number
    pagination?: DataTablePagination
    paginationDisabled?: boolean
    scrollY?: number | string
  }>(),
  {
    dataSource: () => [],
    loading: false,
    showIndex: false,
    paginationDisabled: false,
    total: 0,
  },
)

/** 沿用旧组件的事件名（含历史拼写），存量调用方无需改动 */
const emit = defineEmits<{
  'handle-pagintion': [page: number, pageSize: number]
}>()

/** 每个列 key 都可以作为具名插槽，插槽参数形状与旧组件的 row 一致 */
const slots = defineSlots<
  Record<string, (props: RowCellProps<TRecord> & { dictLabel: string }) => any>
>() as Record<string, CellSlotFn | undefined>

const { table, visibleColumns } = useDataTable<TRecord>({
  columns: () => props.columns,
  data: () => props.dataSource,
  showIndex: () => props.showIndex,
  rowKey: () => props.rowKey,
})

const rows = computed(() => table.getRowModel().rows)

const scrollStyle = computed(() => {
  const { scrollY } = props
  if (scrollY === undefined) {
    return undefined
  }
  return { maxHeight: typeof scrollY === 'number' ? `${scrollY}px` : scrollY }
})

/** 冻结列偏移由 columnSizingFeature 计算，与 colgroup 用的是同一套列宽 */
function pinnedStyle(column: DataTableColumnInstance<TRecord>) {
  const pinned = column.getIsPinned()
  if (pinned === 'start') {
    return { left: `${column.getStart('start')}px` }
  }
  if (pinned === 'end') {
    return { right: `${column.getAfter('end')}px` }
  }
  return undefined
}

/** 冻结区边界列画阴影。getIsLastColumn 属于未注册的 columnOrderingFeature，这里自行推导 */
const lastStartColumnId = computed(() => table.getStartVisibleLeafColumns().at(-1)?.id)
const firstEndColumnId = computed(() => table.getEndVisibleLeafColumns()[0]?.id)

function cellClass(column: DataTableColumnInstance<TRecord>) {
  const model = getColumnModel(column)
  const pinned = column.getIsPinned()
  return [
    `dt-align-${model.align}`,
    pinned === 'start' && 'dt-pinned dt-pinned-start',
    pinned === 'end' && 'dt-pinned dt-pinned-end',
    column.id === lastStartColumnId.value && 'dt-pinned-start-last',
    column.id === firstEndColumnId.value && 'dt-pinned-end-first',
  ]
}

const current = computed(() => props.pagination?.current ?? 1)
const pageSize = computed(() => props.pagination?.pageSize ?? 10)
const pageCount = computed(() => Math.max(1, Math.ceil(props.total / pageSize.value)))

function changePage(page: number) {
  if (page < 1 || page > pageCount.value || page === current.value) {
    return
  }
  emit('handle-pagintion', page, pageSize.value)
}

function changePageSize(event: Event) {
  const size = Number((event.target as HTMLSelectElement).value)
  emit('handle-pagintion', 1, size)
}
</script>

<template>
  <div class="dt-root">
    <div class="dt-scroll" :style="scrollStyle">
      <table class="dt-table" :style="{ width: `${table.getTotalSize()}px` }">
        <colgroup>
          <col
            v-for="column in visibleColumns"
            :key="column.id"
            :style="{ width: `${column.getSize()}px` }"
          />
        </colgroup>
        <thead>
          <tr>
            <th
              v-for="column in visibleColumns"
              :key="column.id"
              :class="cellClass(column)"
              :style="pinnedStyle(column)"
            >
              <span class="dt-header-title">{{ getColumnModel(column).title }}</span>
              <span
                v-if="getColumnModel(column).headerTooltip"
                class="dt-header-tip"
                :title="getColumnModel(column).headerTooltip"
                >?</span
              >
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td
              v-for="column in visibleColumns"
              :key="column.id"
              :class="cellClass(column)"
              :style="pinnedStyle(column)"
            >
              <BodyCell
                :column="getColumnModel(column)"
                :record="row.original"
                :index="row.index"
                :empty-text="emptyText"
                :slot-fn="slots[column.id]"
              />
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="visibleColumns.length" class="dt-placeholder">
              {{ loading ? '加载中…' : '暂无数据' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading && rows.length" class="dt-loading">加载中…</div>

    <div v-if="!paginationDisabled" class="dt-pagination">
      <span class="dt-total">共 {{ total }} 条</span>
      <select class="dt-page-size" :value="pageSize" @change="changePageSize">
        <option v-for="size in [10, 20, 50, 100]" :key="size" :value="size">
          {{ size }} 条/页
        </option>
      </select>
      <button type="button" :disabled="current <= 1" @click="changePage(current - 1)">
        上一页
      </button>
      <span class="dt-page-current">{{ current }} / {{ pageCount }}</span>
      <button
        type="button"
        :disabled="current >= pageCount"
        @click="changePage(current + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<style scoped>
.dt-root {
  font-size: 14px;
  color: #303133;
}

.dt-scroll {
  overflow: auto;
  border: 1px solid #ebeef5;
}

/* table-layout: fixed 让 colgroup 独占列宽话事权，tbody 内容永远顶不开列 */
.dt-table {
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
}

.dt-table th,
.dt-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
  border-right: 1px solid #ebeef5;
  background: #fff;
  overflow: hidden;
  white-space: nowrap;
}

.dt-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fafafa;
  font-weight: 600;
  text-align: left;
}

/* 冻结列：sticky 偏移取自 columnSizingFeature；th 需要更高层级压住 td */
.dt-pinned {
  position: sticky;
  z-index: 1;
}

.dt-table th.dt-pinned {
  z-index: 3;
}

.dt-pinned-start-last {
  box-shadow: 2px 0 4px -2px rgb(0 0 0 / 15%);
}

.dt-pinned-end-first {
  box-shadow: -2px 0 4px -2px rgb(0 0 0 / 15%);
}

.dt-align-left {
  text-align: left;
}

.dt-align-center {
  text-align: center;
}

.dt-align-right {
  text-align: right;
}

.dt-header-tip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-left: 4px;
  border: 1px solid #c0c4cc;
  border-radius: 50%;
  font-size: 10px;
  color: #909399;
  cursor: help;
}

.dt-placeholder {
  padding: 40px 0;
  text-align: center;
  color: #909399;
}

.dt-loading {
  padding: 6px 12px;
  color: #909399;
}

.dt-pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
}

.dt-total {
  color: #909399;
}

.dt-pagination button,
.dt-page-size {
  padding: 4px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.dt-pagination button:disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}
</style>

<style>
.dt-ellipsis {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.dt-tag {
  display: inline-block;
  padding: 0 8px;
  border: 1px solid currentcolor;
  border-radius: 4px;
  line-height: 20px;
  font-size: 12px;
}

.dt-link {
  color: #1677ff;
  text-decoration: none;
  cursor: pointer;
}

.dt-link:hover {
  text-decoration: underline;
}
</style>
