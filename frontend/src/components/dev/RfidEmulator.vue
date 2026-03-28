<template>
  <div v-if="isDev" class="rfid-emulator" :class="{ 'is-minimized': isMinimized }">
    <v-card class="pa-2" elevation="8" color="surface-dark">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-caption font-weight-bold">🛠 Dev: RFID Emulation</div>
        <v-btn icon size="x-small" variant="text" @click="isMinimized = !isMinimized">
          <v-icon>{{ isMinimized ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>
      </div>

      <div v-if="!isMinimized">
        <v-text-field
          v-model="token"
          density="compact"
          hide-details
          variant="outlined"
          class="mb-2"
          placeholder="Token ID"
        ></v-text-field>
        <v-btn size="small" color="primary" block @click="simulateScan" class="mb-2">Scan simulieren</v-btn>
        <div class="mt-1">
          <div class="text-caption font-weight-bold mb-1">Test-Tokens:</div>
          <div v-for="(t, i) in fixedTokens" :key="i" class="d-flex align-center mb-1">
            <code class="text-caption flex-grow-1" style="font-size:10px; cursor:pointer;" @click="token = t">{{ t }}</code>
            <v-btn icon size="x-small" variant="text" @click="token = t; simulateScan()"><v-icon size="14">mdi-play</v-icon></v-btn>
          </div>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isDev = import.meta.env.DEV
const isMinimized = ref(false)
const token = ref('dev-rfid-12345')

const fixedTokens = [
  'dev-rfid-12345',
  'dev-rfid-67890',
  'dev-rfid-abcde',
  'dev-rfid-fghij',
  'dev-rfid-klmno',
]

function simulateScan() {
  for (const char of token.value) {
    window.dispatchEvent(new KeyboardEvent('keypress', { key: char }))
  }
  window.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }))
}
</script>

<style scoped>
.rfid-emulator {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 9999;
  width: 280px;
  transition: transform 0.3s ease;
}

.rfid-emulator.is-minimized {
  width: 200px;
}
</style>
