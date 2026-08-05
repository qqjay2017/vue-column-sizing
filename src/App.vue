<script setup lang="ts">
import { ref } from 'vue'
import DemoBasic from './demo/DemoBasic.vue'
import DemoCompare from './demo/DemoCompare.vue'
import DemoColumnSizing from './demo/DemoColumnSizing.vue'

const tabs = [
  { key: 'basic', label: '值渲染管线' },
  { key: 'compare', label: '新旧口径对比' },
  { key: 'sizing', label: '原 column-sizing 示例' },
] as const

const active = ref<(typeof tabs)[number]['key']>('basic')
</script>

<template>
  <nav class="app-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      :class="{ active: active === tab.key }"
      @click="active = tab.key"
    >
      {{ tab.label }}
    </button>
  </nav>

  <DemoBasic v-if="active === 'basic'" />
  <DemoCompare v-else-if="active === 'compare'" />
  <DemoColumnSizing v-else />
</template>

<style scoped>
.app-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.app-tabs button {
  padding: 6px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.app-tabs button.active {
  border-color: #1677ff;
  color: #1677ff;
}
</style>
