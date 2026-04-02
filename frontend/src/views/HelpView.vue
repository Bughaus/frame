<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-help-circle-outline</v-icon>
      <h1 class="text-h3 font-weight-bold">{{ t('help.title') }}</h1>
    </div>

    <v-row>
      <v-col cols="12" md="8">
        <v-expansion-panels variant="accordion">
          <!-- Basic Member Help (Always visible) -->
          <v-expansion-panel elevation="1">
            <v-expansion-panel-title class="font-weight-bold">
              <v-icon start color="primary">mdi-silverware</v-icon>
              {{ t('help.q1') }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              {{ t('help.a1') }}
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel elevation="1">
            <v-expansion-panel-title class="font-weight-bold">
              <v-icon start color="primary">mdi-contactless-payment</v-icon>
              {{ t('help.q2') }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              {{ t('help.a2') }}
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel elevation="1">
            <v-expansion-panel-title class="font-weight-bold">
              <v-icon start color="primary">mdi-clock-outline</v-icon>
              {{ t('help.q3') }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              {{ t('help.a3') }}
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel elevation="1">
            <v-expansion-panel-title class="font-weight-bold">
              <v-icon start color="primary">mdi-wallet-outline</v-icon>
              {{ t('help.q4') }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              {{ t('help.a4') }}
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Staff/Vorstand Management Help -->
          <v-expansion-panel elevation="1" v-if="authStore.hasRole(['VORSTAND', 'MITARBEITER'])">
            <v-expansion-panel-title class="font-weight-bold text-primary">
              <v-icon start color="primary">mdi-cash-register</v-icon>
              {{ t('help.qManagePos') }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              {{ t('help.aManagePos') }}
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel elevation="1" v-if="authStore.hasRole(['VORSTAND', 'MITARBEITER'])">
            <v-expansion-panel-title class="font-weight-bold text-primary">
              <v-icon start color="primary">mdi-account-group</v-icon>
              {{ t('help.qManageMembers') }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              {{ t('help.aManageMembers') }}
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel elevation="1" v-if="authStore.hasRole(['VORSTAND'])">
            <v-expansion-panel-title class="font-weight-bold text-primary">
              <v-icon start color="primary">mdi-bank</v-icon>
              {{ t('help.qAccounting') }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              {{ t('help.aAccounting') }}
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="2" class="bg-surface-variant">
          <v-card-title>{{ t('help.supportTitle') }}</v-card-title>
          <v-card-text>
            <p class="mb-4">{{ t('help.supportHint') }}</p>
            <v-list density="compact" class="bg-transparent">
              <v-list-item prepend-icon="mdi-email-outline" title="support@verein.de"></v-list-item>
              <v-list-item prepend-icon="mdi-account-tie" :title="`${t('members.identify')}: Michael`"></v-list-item>
            </v-list>
            <v-alert type="info" variant="tonal" density="compact" class="mt-4">
              {{ t('help.feedbackHint') }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth.store'

const { t } = useI18n()
const authStore = useAuthStore()
</script>
