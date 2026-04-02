<template>
  <v-dialog v-model="store.isOpen" max-width="400" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="bg-warning text-white d-flex align-center py-3">
        <v-icon start icon="mdi-alert-circle-outline" class="mr-2"></v-icon>
        <span class="text-h6 font-weight-bold">{{ store.title || t('common.confirm') }}</span>
      </v-card-title>
      
      <v-card-text class="pt-6 pb-4 text-body-1">
        {{ store.message }}
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          color="grey-darken-1"
          class="px-4"
          @click="handleCancel"
        >
          {{ t('common.cancel') }}
        </v-btn>
        <v-btn
          color="warning"
          variant="flat"
          class="px-6 ml-2 font-weight-bold"
          @click="handleConfirm"
        >
          {{ t('common.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useConfirmStore } from '../stores/confirm.store'
import { useI18n } from 'vue-i18n'

const store = useConfirmStore()
const { t } = useI18n()

function handleCancel() {
  store.resolve(false)
}

function handleConfirm() {
  store.resolve(true)
}
</script>

<style scoped>
.v-card-title {
  letter-spacing: 0.0125em;
}
</style>
