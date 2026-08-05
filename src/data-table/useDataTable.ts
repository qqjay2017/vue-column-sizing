import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import {
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  metaHelper,
  tableFeatures,
  useTable,
} from '@tanstack/vue-table'
import type { Column, ColumnDef, RowData } from '@tanstack/vue-table'
import type { DataTableColumn, NormalizedColumn } from './interface'
import type { DataTableColumnMeta } from './normalizeColumns'
import { normalizeColumns } from './normalizeColumns'

/**
 * 首版只注册列宽、冻结列、列显隐三个 feature。
 * 值取数不走 tanstack accessor（由值渲染管线负责），所以列全部是 display column。
 */
export const dataTableFeatures = tableFeatures({
  columnSizingFeature,
  columnPinningFeature,
  columnVisibilityFeature,
  columnMeta: metaHelper<DataTableColumnMeta>(),
})

export type DataTableFeatures = typeof dataTableFeatures

export const DEFAULT_COLUMN_WIDTH = 160
export const MIN_COLUMN_WIDTH = 40

export type DataTableColumnInstance<TRecord extends RowData> = Column<
  DataTableFeatures,
  TRecord,
  unknown
>

export interface UseDataTableOptions<TRecord extends RowData> {
  columns: MaybeRefOrGetter<Array<DataTableColumn<TRecord>>>
  data: MaybeRefOrGetter<Array<TRecord> | undefined>
  showIndex?: MaybeRefOrGetter<boolean | undefined>
  rowKey?: MaybeRefOrGetter<
    string | ((record: TRecord, index: number) => string | number) | undefined
  >
}

function resolveRowId<TRecord extends RowData>(
  rowKey: string | ((record: TRecord, index: number) => string | number) | undefined,
  record: TRecord,
  index: number,
): string {
  if (typeof rowKey === 'function') {
    return String(rowKey(record, index))
  }
  if (rowKey) {
    return String((record as Record<string, unknown>)[rowKey])
  }
  return String(index)
}

export function useDataTable<TRecord extends Record<string, any>>(
  options: UseDataTableOptions<TRecord>,
) {
  const normalizedColumns = computed(() =>
    normalizeColumns(toValue(options.columns), {
      showIndex: toValue(options.showIndex) ?? false,
    }),
  )

  const columnDefs = computed<Array<ColumnDef<DataTableFeatures, TRecord, unknown>>>(
    () =>
      normalizedColumns.value.map((column) => ({
        id: column.id,
        header: column.title,
        size: column.width ?? DEFAULT_COLUMN_WIDTH,
        meta: { column: column as NormalizedColumn },
      })),
  )

  const data = computed(() => toValue(options.data) ?? [])

  /**
   * 冻结与显隐都由列定义推导，首版不可交互，因此只给受控值、不给 on[State]Change。
   * 注意必须把 computed 本身交给 useTable，传 .value 会断掉后续同步。
   */
  const state = computed(() => ({
    columnPinning: {
      start: normalizedColumns.value
        .filter((column) => column.fixed === 'left')
        .map((column) => column.id),
      end: normalizedColumns.value
        .filter((column) => column.fixed === 'right')
        .map((column) => column.id),
    },
    columnVisibility: Object.fromEntries(
      normalizedColumns.value
        .filter((column) => column.source.isDefaultShow === false)
        .map((column) => [column.id, false]),
    ),
  }))

  const table = useTable<DataTableFeatures, TRecord>({
    features: dataTableFeatures,
    columns: columnDefs,
    data,
    state,
    defaultColumn: { size: DEFAULT_COLUMN_WIDTH, minSize: MIN_COLUMN_WIDTH },
    getRowId: (record: TRecord, index: number) =>
      resolveRowId(toValue(options.rowKey), record, index),
  })

  /** getVisibleLeafColumns 不按冻结区排序，这里显式拼成 start → center → end 的视觉顺序 */
  const visibleColumns = computed<Array<DataTableColumnInstance<TRecord>>>(() => [
    ...table.getStartVisibleLeafColumns(),
    ...table.getCenterVisibleLeafColumns(),
    ...table.getEndVisibleLeafColumns(),
  ])

  return { table, normalizedColumns, visibleColumns }
}

export function getColumnModel<TRecord extends RowData>(
  column: DataTableColumnInstance<TRecord>,
): NormalizedColumn<TRecord> {
  return column.columnDef.meta!.column as NormalizedColumn<TRecord>
}
