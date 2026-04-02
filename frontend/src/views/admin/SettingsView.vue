<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center mb-6">
      <v-icon size="large" color="primary" class="mr-3">mdi-cog-outline</v-icon>
      <div>
        <h1 class="text-h4 font-weight-bold">{{ t('admin.settingsTitle') }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis">{{ t('admin.settingsSubtitle') }}</p>
      </div>
    </div>

    <v-row>
      <v-col cols="12" md="3">
        <v-card rounded="lg" elevation="2">
          <v-tabs v-model="tab" direction="vertical" color="primary">
            <v-tab value="general" prepend-icon="mdi-badge-account-outline">
              {{ t('admin.settingsGeneral') }}
            </v-tab>
            <v-tab value="legal" prepend-icon="mdi-scale-balance">
              {{ t('admin.settingsLegal') }}
            </v-tab>
            <v-tab value="email" prepend-icon="mdi-email-outline">
              {{ t('admin.settingsEmail') }}
            </v-tab>
          </v-tabs>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <v-window v-model="tab">
          <!-- General Settings -->
          <v-window-item value="general">
            <v-card rounded="lg" elevation="2" class="pa-6">
              <h2 class="text-h5 font-weight-bold mb-4">{{ t('admin.settingsBranding') }}</h2>
              <v-row>
                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="configData.CLUB_NAME"
                    :label="t('admin.clubName')"
                    variant="outlined"
                    prepend-inner-icon="mdi-office-building"
                  ></v-text-field>
                  <v-textarea
                    v-model="configData.CLUB_VORSTAND_NAMES"
                    :label="t('admin.vorstandNames')"
                    variant="outlined"
                    rows="2"
                    prepend-inner-icon="mdi-account-group"
                  ></v-textarea>
                  <v-text-field
                    v-model="configData.CLUB_EMAIL"
                    :label="t('admin.clubEmail')"
                    variant="outlined"
                    prepend-inner-icon="mdi-email"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4" class="text-center">
                  <v-sheet 
                    height="150" 
                    width="100%" 
                    color="grey-lighten-4" 
                    rounded="lg" 
                    class="d-flex align-center justify-center mb-4 elevation-1 border-dashed"
                  >
                    <v-img 
                      :src="resolveUrl(configData.CLUB_LOGO_URL) || clubLogoUrl" 
                      alt="Club Logo" 
                      max-height="140" 
                      contain
                    />
                  </v-sheet>
                  <v-file-input
                    accept="image/*"
                    :label="t('admin.uploadLogo')"
                    variant="outlined"
                    density="compact"
                    prepend-icon="mdi-camera"
                    @change="handleLogoUpload"
                    :loading="uploading"
                  ></v-file-input>
                </v-col>
              </v-row>
              <div class="d-flex justify-end mt-4">
                <v-btn color="primary" @click="saveGeneral" :loading="loading">{{ t('common.save') }}</v-btn>
              </div>
            </v-card>
          </v-window-item>

          <!-- Legal Settings -->
          <v-window-item value="legal">
            <v-card rounded="lg" elevation="2" class="pa-6">
              <h2 class="text-h5 font-weight-bold mb-4">{{ t('admin.settingsCompanyInfo') }}</h2>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="configData.CLUB_ADDRESS_STREET"
                    :label="t('admin.street')"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="configData.CLUB_ADDRESS_CITY"
                    :label="t('admin.city')"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="configData.CLUB_ADDRESS_COUNTRY"
                    :label="t('admin.country')"
                    variant="outlined"
                  ></v-text-field>
                  <v-textarea
                    v-model="configData.CLUB_DISCLAIMER"
                    :label="t('admin.disclaimer')"
                    variant="outlined"
                    rows="2"
                    hide-details
                    class="mb-3"
                  ></v-textarea>
                  <v-textarea
                    v-model="configData.CLUB_WEBSITE_DISCLAIMER"
                    :label="t('admin.websiteDisclaimer')"
                    variant="outlined"
                    rows="2"
                  ></v-textarea>
                </v-col>
                <v-divider class="mx-3 w-100 my-4"></v-divider>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="configData.CLUB_IBAN"
                    :label="t('admin.iban')"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="configData.CLUB_BIC"
                    :label="t('admin.bic')"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>
              <div class="d-flex justify-end mt-4">
                <v-btn color="primary" @click="saveLegal" :loading="loading">{{ t('common.save') }}</v-btn>
              </div>
            </v-card>
          </v-window-item>

          <!-- Email Settings -->
          <v-window-item value="email">
            <v-card rounded="lg" elevation="2" class="pa-6">
              <div class="d-flex justify-space-between align-center mb-4">
                <h2 class="text-h5 font-weight-bold">{{ t('admin.settingsMailserver') }}</h2>
                <v-btn
                  color="secondary"
                  variant="outlined"
                  prepend-icon="mdi-email-send-outline"
                  @click="testEmail"
                  :loading="testingEmail"
                >
                  {{ t('admin.testConnection') }}
                </v-btn>
              </div>
              <v-row>
                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="configData.MAIL_SMTP_HOST"
                    :label="t('admin.smtpHost')"
                    variant="outlined"
                    placeholder="smtp.example.com"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="configData.MAIL_SMTP_PORT"
                    :label="t('admin.smtpPort')"
                    variant="outlined"
                    type="number"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="configData.MAIL_SMTP_USER"
                    :label="t('admin.smtpUser')"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="configData.MAIL_SMTP_PASS"
                    :label="t('admin.smtpPass')"
                    async-messages
                    variant="outlined"
                    type="password"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="configData.MAIL_FROM_ADDRESS"
                    :label="t('admin.fromAddress')"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="configData.MAIL_FROM_NAME"
                    :label="t('admin.fromName')"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-switch
                    v-model="configData.MAIL_SMTP_SECURE"
                    true-value="true"
                    false-value="false"
                    :label="t('admin.smtpSecure')"
                    :hint="t('admin.smtpSecureHint')"
                    persistent-hint
                    color="primary"
                    inset
                  ></v-switch>
                </v-col>
              </v-row>
              <div class="d-flex justify-end mt-4">
                <v-btn color="primary" @click="saveEmail" :loading="loading">{{ t('common.save') }}</v-btn>
              </div>
            </v-card>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="4000">
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" @click="snackbar = false">{{ t('common.close') }}</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSystemConfigStore } from '../../stores/system-config.store'
import { storeToRefs } from 'pinia'
import { apiBaseURL } from '../../api/axios'

const { t } = useI18n()
const store = useSystemConfigStore()
const { configs, loading, clubLogoUrl } = storeToRefs(store)

const tab = ref('general')
const uploading = ref(false)
const testingEmail = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Reactive local state
const configData = reactive<Record<string, string>>({
  CLUB_NAME: '',
  CLUB_LOGO_URL: '',
  CLUB_ADDRESS_STREET: '',
  CLUB_ADDRESS_CITY: '',
  CLUB_ADDRESS_COUNTRY: '',
  CLUB_IBAN: '',
  CLUB_BIC: '',
  CLUB_VORSTAND_NAMES: '',
  CLUB_EMAIL: '',
  CLUB_DISCLAIMER: '',
  CLUB_WEBSITE_DISCLAIMER: '',
  AUTH_RFID_ENABLED: 'true',
  MAIL_SMTP_HOST: '',
  MAIL_SMTP_PORT: '',
  MAIL_SMTP_USER: '',
  MAIL_SMTP_PASS: '',
  MAIL_FROM_ADDRESS: '',
  MAIL_FROM_NAME: '',
  MAIL_SMTP_SECURE: 'false'
})

onMounted(async () => {
  await store.fetchAdminConfig()
  // Hydrate local state
  Object.keys(configData).forEach(key => {
    if (configs.value[key]) {
      configData[key] = configs.value[key]
    }
  })
})

const handleLogoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return

  uploading.value = true
  try {
    const url = await store.uploadLogo(target.files[0])
    configData.CLUB_LOGO_URL = url
    showSnackbar(t('admin.logoUploaded'), 'success')
  } catch (e) {
    showSnackbar(t('admin.logoUploadFailed'), 'error')
  } finally {
    uploading.value = false
  }
}

const saveGeneral = async () => {
  await saveBatch(['CLUB_NAME', 'CLUB_LOGO_URL', 'CLUB_VORSTAND_NAMES', 'CLUB_EMAIL', 'AUTH_RFID_ENABLED'])
  // Wait a moment for the snackbar then reload to sync all components
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

const saveLegal = async () => {
  await saveBatch(['CLUB_ADDRESS_STREET', 'CLUB_ADDRESS_CITY', 'CLUB_ADDRESS_COUNTRY', 'CLUB_IBAN', 'CLUB_BIC', 'CLUB_DISCLAIMER', 'CLUB_WEBSITE_DISCLAIMER'])
}

const saveEmail = async () => {
  await saveBatch(['MAIL_SMTP_HOST', 'MAIL_SMTP_PORT', 'MAIL_SMTP_USER', 'MAIL_SMTP_PASS', 'MAIL_FROM_ADDRESS', 'MAIL_FROM_NAME', 'MAIL_SMTP_SECURE'])
}

const saveBatch = async (keys: string[]) => {
  const updates: Record<string, string> = {}
  keys.forEach(k => {
    updates[k] = configData[k] || ''
  })

  try {
    await store.updateConfigs(updates)
    showSnackbar(t('common.savedSuccessfully'), 'success')
  } catch (e) {
    showSnackbar(t('common.saveFailed'), 'error')
  }
}

const testEmail = async () => {
  testingEmail.value = true
  try {
    const res = await store.sendTestEmail()
    showSnackbar(res.message || t('admin.emailSent'), 'success')
  } catch (e: any) {
    showSnackbar(e.response?.data?.message || t('admin.emailFailed'), 'error')
  } finally {
    testingEmail.value = false
  }
}

const resolveUrl = (url: string) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const backendOrigin = apiBaseURL.split('/api/v1')[0];
  return `${backendOrigin}${url}`;
}

const showSnackbar = (text: string, color: string) => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>

<style scoped>
.v-tab--vertical {
  justify-content: flex-start;
}
</style>
