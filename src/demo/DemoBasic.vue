<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  DataTable,
  ValueCell,
  createValueFormatter,
  defineColumns,
  formatValue,
  setDataTableConfig,
} from '../data-table'
import type { Bill } from './mockDict'
import {
  billStatusColorMap,
  getDictLabel,
  makeBills,
  payChannelOptions,
} from './mockDict'

setDataTableConfig({ dict: { getLabel: getDictLabel } })

const all = ref(makeBills(23))
const pagination = ref({ current: 1, pageSize: 10 })
const loading = ref(false)

const dataSource = computed(() => {
  const start = (pagination.value.current - 1) * pagination.value.pageSize
  return all.value.slice(start, start + pagination.value.pageSize)
})

function onPagination(page: number, pageSize: number) {
  pagination.value = { current: page, pageSize }
}

function stress() {
  all.value = makeBills(1000)
  pagination.value = { current: 1, pageSize: 1000 }
}

function reset() {
  all.value = makeBills(23)
  pagination.value = { current: 1, pageSize: 10 }
}

const columns = defineColumns<Bill>([
  { dataIndex: 'billNo', title: '账单号', width: 150, fixed: 'left' },
  { dataIndex: 'customerName', title: '客户', width: 100, fixed: 'left' },

  // 字典单值：只写 dict 不写 valueType（存量 1273 处的写法）
  { dataIndex: 'billStatus', title: '状态(dict)', width: 110, dict: 'billStatus' },

  // 组合能力判据：dict 负责文案，cellRender 负责外观
  {
    dataIndex: 'billStatus',
    key: 'billStatusTag',
    title: '状态(dict+cellRender)',
    width: 170,
    dict: 'billStatus',
    cellRender: ({ text, value }) =>
      h(
        'span',
        {
          class: 'dt-tag',
          style: {
            color: billStatusColorMap[String(value)] ?? '#8c8c8c',
            borderColor: billStatusColorMap[String(value)] ?? '#8c8c8c',
          },
        },
        text,
      ),
  },

  // 字典项数组形态
  { dataIndex: 'payChannel', title: '支付渠道', width: 110, dict: payChannelOptions },

  // 多值字典：数组 与 逗号分隔字符串
  { dataIndex: 'bizTags', title: '业务标签(数组)', width: 140, dict: 'bizTag' },
  { dataIndex: 'bizTagsText', title: '业务标签(逗号串)', width: 150, dict: 'bizTag' },

  // 日期时间
  { dataIndex: 'signDate', title: '签约日(date)', width: 130, valueType: 'date' },
  { dataIndex: 'settleMonth', title: '结算月(month)', width: 130, valueType: 'month' },
  { dataIndex: 'payTime', title: '支付时间(time)', width: 170, valueType: 'time' },
  { dataIndex: 'closedTime', title: '关闭时间(非法值)', width: 150, valueType: 'datetime' },

  // 金额
  {
    dataIndex: 'amountCents',
    title: '金额(分转元)',
    width: 130,
    valueType: 'money',
    moneyCentsToYuan: true,
  },
  { dataIndex: 'amountYuan', title: '金额(元)', width: 120, valueType: 'money' },
  {
    dataIndex: 'amountYuan',
    key: 'amountSymbol',
    title: '金额(带符号)',
    width: 130,
    valueType: 'money',
    valueTypeProps: { symbol: true },
  },
  { dataIndex: 'rate', title: '费率', width: 90, valueType: 'percent' },

  // 组件类内置 valueType
  {
    dataIndex: 'billStatus',
    key: 'statusTagType',
    title: '状态(valueType:tag)',
    width: 160,
    valueType: 'tag',
    valueTypeProps: { colorMap: billStatusColorMap },
  },
  {
    dataIndex: 'billNo',
    key: 'billLink',
    title: '详情(link)',
    width: 150,
    valueType: 'link',
    valueTypeProps: {
      onClick: (value: unknown) => window.alert(`打开账单 ${String(value)}`),
    },
  },

  // 深层取值
  {
    dataIndex: ['customer', 'contact', 'phone'],
    title: '联系电话',
    width: 130,
  },

  // 溢出省略 + hover tooltip
  { dataIndex: 'remark', title: '备注(ellipsis)', width: 180, ellipsis: true },

  // legacy customRender：返回 VNode / 返回字符串
  {
    dataIndex: 'customerName',
    key: 'legacyNode',
    title: 'legacy(VNode)',
    width: 140,
    customRender: (row) => h('b', { style: { color: '#1677ff' } }, row.record.customerName),
  },
  {
    dataIndex: 'amountYuan',
    key: 'legacyText',
    title: 'legacy(字符串+ellipsis)',
    width: 140,
    ellipsis: true,
    customRender: (row) =>
      `¥ ${row.record.amountYuan.toFixed(2)}（${row.record.customerName} 的应收账款）`,
  },

  // 隐藏列
  { dataIndex: 'id', title: '不该出现', width: 120, isDefaultShow: false },

  // 具名插槽接管
  { dataIndex: 'billStatus', key: 'action', title: '操作', width: 160, fixed: 'right' },
])

/** 存量写法 `value: (val) => formatAmountColumn(val)` 的等价替换 */
const formatBillAmount = createValueFormatter('money', { centsToYuan: true, symbol: true })

const sample = computed(() => all.value[0])

const descriptions: Array<{ label: string; value: (bill: Bill) => string }> = [
  { label: '原账单总额（元）', value: (bill) => formatBillAmount(bill.amountCents) },
  { label: '账单状态', value: (bill) => formatValue('dict', bill.billStatus, { dict: 'billStatus' }) },
  { label: '签约日期', value: (bill) => formatValue('date', bill.signDate) },
  { label: '支付时间', value: (bill) => formatValue('datetime', bill.payTime) },
]
</script>

<template>
  <section class="demo">
    <header class="demo-bar">
      <h2>值渲染管线 · 全覆盖</h2>
      <button type="button" @click="stress">压测 1000 行</button>
      <button type="button" @click="reset">恢复 23 行</button>
      <label>
        <input v-model="loading" type="checkbox" />
        loading
      </label>
    </header>

    <DataTable
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :total="all.length"
      :pagination="pagination"
      :scroll-y="420"
      row-key="id"
      show-index
      @handle-pagintion="onPagination"
    >
      <template #action="{ record, text, value, index }">
        <span class="demo-slot">
          <a href="#" @click.prevent>编辑</a>
          <em>#{{ index }} / {{ value }} / {{ text }} / {{ record.billNo }}</em>
        </span>
      </template>
    </DataTable>

    <h2 class="demo-subtitle">脱离表格复用同一套值处理</h2>

    <!-- 函数形态：配置里 value 是格式化函数，取代各处手写 formatAmountColumn -->
    <dl class="demo-descriptions">
      <template v-for="item in descriptions" :key="item.label">
        <dt>{{ item.label }}</dt>
        <dd>{{ item.value(sample) }}</dd>
      </template>
    </dl>

    <!-- 组件形态：自带该 valueType 声明的样式（money 走 dt-money 字体） -->
    <div class="demo-value-cells">
      <span>组件形态：</span>
      <ValueCell type="money" :value="123456" :options="{ centsToYuan: true, symbol: true }" />
      <ValueCell type="dict" :value="'1'" :options="{ dict: 'billStatus' }" />
      <ValueCell type="date" :value="'2026-08-05 12:00:00'" />
      <ValueCell type="tag" :value="'新签'" :options="{ defaultColor: '#1677ff' }" />
    </div>
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

.demo-subtitle {
  margin: 24px 0 12px;
  font-size: 16px;
}

.demo-descriptions {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 8px 16px;
  margin: 0 0 16px;
}

.demo-descriptions dt {
  color: #909399;
}

.demo-descriptions dd {
  margin: 0;
}

.demo-value-cells {
  display: flex;
  align-items: center;
  gap: 16px;
}

.demo-slot {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.demo-slot em {
  font-size: 11px;
  color: #909399;
  font-style: normal;
}
</style>
