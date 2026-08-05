<script setup lang="ts">
import { computed } from 'vue'
import type { DataTableColumn } from '../data-table'
import { normalizeColumns, resolveCellText, setDataTableConfig } from '../data-table'
import { getDictLabel, payChannelOptions } from './mockDict'

setDataTableConfig({ dict: { getLabel: getDictLabel } })

const SENTINEL = '1000-01-01 00:00:00'

/* ---------- 旧口径复刻：valueTypeRender / renderDictLabel / removeEmptyStrValue ---------- */

function legacyIsEmptyText(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

/** 旧 dictStore.getLabel 未命中直接给 '-'，且只支持单值严格 === 匹配 */
function legacyDictLabel(dict: DataTableColumn['dict'], value: unknown): string {
  if (legacyIsEmptyText(value)) {
    return '-'
  }
  if (typeof dict === 'string') {
    return getDictLabel(dict, value as string) ?? '-'
  }
  if (Array.isArray(dict)) {
    return dict.find((item) => item.value === value)?.label ?? '-'
  }
  return '-'
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** 旧 valueTypeRender：空值与哨兵日期都返回空串 */
function legacyValueType(
  valueType: string | undefined,
  value: unknown,
  centsToYuan = false,
): string {
  if (legacyIsEmptyText(value) || value === SENTINEL) {
    return ''
  }
  const date = new Date(String(value).replace(/-/g, '/'))
  const valid = !Number.isNaN(date.getTime())
  switch (valueType) {
    case 'date':
      return valid
        ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
        : String(value)
    case 'month':
      return valid ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}` : String(value)
    case 'time':
      return valid
        ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
        : String(value)
    case 'money': {
      const numeric = Number(value)
      if (Number.isNaN(numeric)) {
        return String(value)
      }
      const yuan = centsToYuan ? numeric / 100 : numeric
      return yuan.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    default:
      return String(value)
  }
}

function legacyRender(column: DataTableColumn, value: unknown): string {
  if (column.dict !== undefined) {
    return legacyDictLabel(column.dict, value)
  }
  return legacyValueType(column.valueType, value, column.moneyCentsToYuan)
}

/* ---------- 对比用例 ---------- */

interface Case {
  name: string
  column: DataTableColumn
  value: unknown
  /** 已知且有意的差异，写明原因 */
  expectedDiff?: string
}

const cases: Array<Case> = [
  { name: '字典命中', column: { dataIndex: 'v', dict: 'billStatus' }, value: '2' },
  {
    name: '字典未命中',
    column: { dataIndex: 'v', dict: 'billStatus' },
    value: '99',
    expectedDiff: '旧口径吞掉原始 code 给 "-"，新口径回落原始 code，便于排查脏数据',
  },
  { name: '字典空值', column: { dataIndex: 'v', dict: 'billStatus' }, value: '' },
  {
    name: '字典 number/string 漂移',
    column: { dataIndex: 'v', dict: payChannelOptions },
    value: 'ALIPAY',
  },
  {
    name: '字典多值(数组)',
    column: { dataIndex: 'v', dict: 'bizTag' },
    value: ['1', '3'],
    expectedDiff: '旧实现只支持单值，数组直接落到 "-"',
  },
  {
    name: '字典多值(逗号串)',
    column: { dataIndex: 'v', dict: 'bizTag' },
    value: '1,2',
    expectedDiff: '旧实现只支持单值，逗号串直接落到 "-"',
  },
  { name: 'date', column: { dataIndex: 'v', valueType: 'date' }, value: '2026-03-07' },
  { name: 'month', column: { dataIndex: 'v', valueType: 'month' }, value: '2026-03-15' },
  {
    name: 'time',
    column: { dataIndex: 'v', valueType: 'time' },
    value: '2026-08-05 09:31:12',
  },
  {
    name: 'date 非法值',
    column: { dataIndex: 'v', valueType: 'date' },
    value: 'not-a-date',
  },
  {
    name: 'date 空值',
    column: { dataIndex: 'v', valueType: 'date' },
    value: '',
    expectedDiff: '旧 valueTypeRender 给空串，新管线统一给 emptyText',
  },
  {
    name: '哨兵日期',
    column: { dataIndex: 'v', valueType: 'time' },
    value: SENTINEL,
    expectedDiff: '旧 valueTypeRender 给空串、removeEmptyStrValue 给 "-"，新管线统一给 emptyText',
  },
  {
    name: 'money 分转元',
    column: { dataIndex: 'v', valueType: 'money', moneyCentsToYuan: true },
    value: 123456,
  },
  { name: 'money 元', column: { dataIndex: 'v', valueType: 'money' }, value: 1234567.891 },
  {
    name: 'money NaN',
    column: { dataIndex: 'v', valueType: 'money' },
    value: Number.NaN,
    expectedDiff: '旧口径把 NaN 原样吐出，新管线给 emptyText',
  },
  {
    name: 'money 空值',
    column: { dataIndex: 'v', valueType: 'money' },
    value: '',
    expectedDiff: '旧 valueTypeRender 给空串，新管线统一给 emptyText',
  },
  { name: '纯文本', column: { dataIndex: 'v' }, value: 'BL20260800001' },
  {
    name: '纯文本空值',
    column: { dataIndex: 'v' },
    value: null,
    expectedDiff: '旧 valueTypeRender 给空串，新管线统一给 emptyText',
  },
]

const rows = computed(() =>
  cases.map((item) => {
    const [normalized] = normalizeColumns([item.column])
    const next = resolveCellText(normalized, { v: item.value }, 0)
    const legacy = legacyRender(item.column, item.value)
    return {
      ...item,
      legacy,
      next,
      same: legacy === next,
    }
  }),
)

const unexpected = computed(() =>
  rows.value.filter((row) => !row.same && !row.expectedDiff),
)

function display(text: string): string {
  return text === '' ? '(空串)' : text
}

function raw(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.join(', ')}]`
  }
  if (value === '') {
    return '(空串)'
  }
  if (value === null) {
    return 'null'
  }
  return String(value)
}
</script>

<template>
  <section class="demo">
    <header class="demo-bar">
      <h2>新旧口径逐格对比</h2>
      <span :class="unexpected.length ? 'bad' : 'good'">
        {{
          unexpected.length
            ? `存在 ${unexpected.length} 处未标注差异，需要排查`
            : '差异全部在预期清单内'
        }}
      </span>
    </header>

    <table class="compare">
      <thead>
        <tr>
          <th>用例</th>
          <th>原始值</th>
          <th>旧口径</th>
          <th>新口径</th>
          <th>结论</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.name" :class="{ diff: !row.same }">
          <td>{{ row.name }}</td>
          <td class="mono">{{ raw(row.value) }}</td>
          <td class="mono">{{ display(row.legacy) }}</td>
          <td class="mono">{{ display(row.next) }}</td>
          <td>
            <span v-if="row.same" class="good">一致</span>
            <span v-else-if="row.expectedDiff" class="warn">预期差异：{{ row.expectedDiff }}</span>
            <span v-else class="bad">未标注差异</span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.demo {
  padding: 16px;
}

.demo-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.demo-bar h2 {
  margin: 0;
  font-size: 16px;
}

.compare {
  border-collapse: collapse;
  font-size: 13px;
}

.compare th,
.compare td {
  padding: 6px 10px;
  border: 1px solid #ebeef5;
  text-align: left;
}

.compare th {
  background: #fafafa;
}

.compare tr.diff {
  background: #fffbe6;
}

.mono {
  font-family: ui-monospace, monospace;
}

.good {
  color: #52c41a;
}

.warn {
  color: #d48806;
}

.bad {
  color: #ff4d4f;
}
</style>
