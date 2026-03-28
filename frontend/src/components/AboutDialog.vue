<template>
  <v-dialog v-model="model" max-width="680px" scrollable>
    <v-card rounded="xl" elevation="24">

      <!-- Header -->
      <div class="about-header pa-6 pb-4 d-flex align-center">
        <div class="about-logo mr-4 elevation-4">
          <v-img src="/logo.png" alt="Logo" cover />
        </div>
        <div>
          <div class="text-h4 font-weight-black" style="letter-spacing: 0.2em;">FRAME</div>
          <div class="text-caption mt-1" style="opacity: 0.85;">
            Financials, Records, Activity, and Member Expenses
          </div>
        </div>
        <v-spacer />
        <v-chip color="warning" variant="tonal" size="small" prepend-icon="mdi-flask-outline">
          Early Development
        </v-chip>
      </div>

      <v-divider />

      <v-card-text class="pa-0" style="max-height: 70vh;">
        <v-list lines="two" class="py-0">

          <!-- Purpose -->
          <v-list-item prepend-icon="mdi-information-outline">
            <v-list-item-title class="font-weight-bold">Zweck / Purpose</v-list-item-title>
            <div class="text-body-2 text-medium-emphasis mt-1 text-wrap">
              FRAME is an open-source club management system for sports clubs and associations. It handles member administration, finances, invoicing, SEPA exports, working-hour tracking, and point-of-sale operations.
            </div>
          </v-list-item>

          <v-divider inset />

          <!-- Version & Status -->
          <v-list-item prepend-icon="mdi-tag-outline">
            <v-list-item-title class="font-weight-bold">Version</v-list-item-title>
            <div class="mt-1">
              <v-chip size="x-small" color="primary" variant="tonal" class="mr-2">v{{ version }}</v-chip>
              <v-chip size="x-small" color="warning" variant="tonal">Prototype · Early Development</v-chip>
            </div>
          </v-list-item>

          <v-divider inset />

          <!-- Developer -->
          <v-list-item prepend-icon="mdi-account-hard-hat-outline">
            <v-list-item-title class="font-weight-bold">Developer</v-list-item-title>
            <div class="text-body-2 text-medium-emphasis mt-1">
              <div>Michael Backhaus</div>
              <div class="d-flex align-center gap-2 mt-2 flex-wrap">
                <v-btn
                  size="x-small" variant="tonal" color="secondary"
                  prepend-icon="mdi-github"
                  href="https://github.com/Bughaus"
                  target="_blank"
                >github.com/Bughaus</v-btn>
              </div>
            </div>
          </v-list-item>

          <v-divider inset />

          <!-- License -->
          <v-list-item prepend-icon="mdi-scale-balance">
            <v-list-item-title class="font-weight-bold">License</v-list-item-title>
            <div class="text-body-2 text-medium-emphasis mt-1 text-wrap">
              <v-chip size="x-small" color="success" variant="tonal" class="mr-2 mb-1">GPL-3.0</v-chip>
              This software is released under the GNU General Public License v3.0.
              <div class="mt-2">
                <v-btn size="x-small" variant="outlined" color="success" prepend-icon="mdi-github"
                  href="https://github.com/Bughaus/frame" target="_blank">
                  View Source & License on GitHub
                </v-btn>
              </div>
            </div>
          </v-list-item>

          <v-divider inset />

          <!-- GitHub Repo -->
          <v-list-item prepend-icon="mdi-source-repository">
            <v-list-item-title class="font-weight-bold">Source Code / Repository</v-list-item-title>
            <div class="text-body-2 text-medium-emphasis mt-1 text-wrap">
              <v-chip size="x-small" color="info" variant="tonal" class="mr-2">Live</v-chip>
              Full source code and documentation are available on GitHub.
              <div class="mt-2">
                <v-btn size="x-small" variant="outlined" color="primary" prepend-icon="mdi-github"
                  href="https://github.com/Bughaus/frame" target="_blank">
                  github.com/Bughaus/frame
                </v-btn>
              </div>
            </div>
          </v-list-item>

          <v-divider inset />

          <!-- Changelog & Issues -->
          <v-list-item prepend-icon="mdi-bug-outline">
            <v-list-item-title class="font-weight-bold">Changelog & Bug Reports</v-list-item-title>
            <div class="text-body-2 text-medium-emphasis mt-1 text-wrap">
              Track changes, request features, or report issues on our GitHub issue tracker.
              <div class="d-flex flex-wrap gap-2 mt-2">
                <v-btn size="x-small" variant="outlined" color="secondary" prepend-icon="mdi-format-list-bulleted"
                  href="https://github.com/Bughaus/frame/releases" target="_blank">
                  Changelog
                </v-btn>
                <v-btn size="x-small" variant="outlined" color="error" prepend-icon="mdi-bug-outline"
                  href="https://github.com/Bughaus/frame/issues" target="_blank">
                  Report Issue
                </v-btn>
              </div>
            </div>
          </v-list-item>

          <v-divider inset />

          <!-- Privacy -->
          <v-list-item prepend-icon="mdi-shield-lock-outline">
            <v-list-item-title class="font-weight-bold">Datenschutz / Privacy</v-list-item-title>
            <div class="text-body-2 text-medium-emphasis mt-1 text-wrap">
              <v-chip size="x-small" color="info" variant="tonal" class="mr-2 mb-2">Self-Hosted</v-chip>
              <div class="privacy-list">
                <div class="privacy-item"><v-icon size="14" color="success" class="mr-1">mdi-check-circle</v-icon> <strong>Data Storage:</strong> All member data (name, address, IBAN, RFID, login history) is stored exclusively on your own server.</div>
                <div class="privacy-item"><v-icon size="14" color="success" class="mr-1">mdi-check-circle</v-icon> <strong>Data Controller:</strong> The club operator — not the developer — is responsible as the data controller (DSGVO Art. 4(7)).</div>
                <div class="privacy-item"><v-icon size="14" color="success" class="mr-1">mdi-check-circle</v-icon> <strong>Legal Basis:</strong> Processing is based on membership contract performance (DSGVO Art. 6(1)(b)).</div>
                <div class="privacy-item"><v-icon size="14" color="success" class="mr-1">mdi-check-circle</v-icon> <strong>No Third Parties:</strong> No data is shared with external services. No analytics, no cloud sync.</div>
                <div class="privacy-item"><v-icon size="14" color="success" class="mr-1">mdi-check-circle</v-icon> <strong>Security:</strong> Passwords are bcrypt-hashed, sessions use short-lived JWTs. RFID tokens are SHA-256 hashed.</div>
                <div class="privacy-item"><v-icon size="14" color="success" class="mr-1">mdi-check-circle</v-icon> <strong>Member Rights:</strong> Data rectification requests are handled via the built-in <em>Änderungsanträge</em> system.</div>
                <div class="privacy-item"><v-icon size="14" color="warning" class="mr-1">mdi-clock-outline</v-icon> <strong>Retention Policy:</strong> To be defined by the club. Inactive member data should be deleted within the legally required period.</div>
              </div>
            </div>
          </v-list-item>

          <v-divider inset />

          <!-- Component Licenses -->
          <v-list-item prepend-icon="mdi-package-variant-closed">
            <v-list-item-title class="font-weight-bold mb-3">Open Source Components</v-list-item-title>
            <div class="px-0 pb-2">
              <v-table density="compact" class="rounded-lg" style="font-size: 0.75rem;">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Version</th>
                    <th>License</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="dep in dependencies" :key="dep.name">
                    <td>
                      <a :href="dep.url" target="_blank" class="text-primary text-decoration-none">{{ dep.name }}</a>
                    </td>
                    <td class="text-medium-emphasis">{{ dep.version }}</td>
                    <td>
                      <v-chip size="x-small" :color="dep.licenseColor" variant="tonal">{{ dep.license }}</v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-list-item>

        </v-list>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <div class="text-caption text-disabled">
          © {{ new Date().getFullYear() }} Michael Backhaus · GPL-3.0
        </div>
        <v-spacer />
        <v-btn variant="flat" color="primary" @click="model = false">Schließen</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const model = defineModel<boolean>({ default: false })

declare const __APP_VERSION__: string
const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0'

const dependencies = [
  // Frontend
  { name: 'Vue.js 3', version: '^3.5', license: 'MIT', licenseColor: 'success', url: 'https://vuejs.org' },
  { name: 'Vuetify 3', version: '^3.7', license: 'MIT', licenseColor: 'success', url: 'https://vuetifyjs.com' },
  { name: 'Vue Router', version: '^4', license: 'MIT', licenseColor: 'success', url: 'https://router.vuejs.org' },
  { name: 'Pinia', version: '^2', license: 'MIT', licenseColor: 'success', url: 'https://pinia.vuejs.org' },
  { name: 'vue-i18n', version: '^9', license: 'MIT', licenseColor: 'success', url: 'https://vue-i18n.intlify.dev' },
  { name: 'Axios', version: '^1', license: 'MIT', licenseColor: 'success', url: 'https://axios-http.com' },
  { name: 'Material Design Icons', version: '^7', license: 'Apache-2.0', licenseColor: 'info', url: 'https://pictogrammers.com/library/mdi/' },
  // Backend
  { name: 'NestJS', version: '^10', license: 'MIT', licenseColor: 'success', url: 'https://nestjs.com' },
  { name: 'Prisma ORM', version: '^5', license: 'Apache-2.0', licenseColor: 'info', url: 'https://prisma.io' },
  { name: 'Passport.js', version: '^0.7', license: 'MIT', licenseColor: 'success', url: 'http://www.passportjs.org' },
  { name: 'JSON Web Token', version: '^9', license: 'MIT', licenseColor: 'success', url: 'https://github.com/auth0/node-jsonwebtoken' },
  { name: 'bcrypt', version: '^5', license: 'MIT', licenseColor: 'success', url: 'https://github.com/dcodeIO/bcrypt.js' },
  { name: 'Multer', version: '^1', license: 'MIT', licenseColor: 'success', url: 'https://github.com/expressjs/multer' },
  { name: 'PDFKit', version: '^0.15', license: 'MIT', licenseColor: 'success', url: 'https://pdfkit.org' },
  { name: 'xmlbuilder2', version: '^3', license: 'MIT', licenseColor: 'success', url: 'https://github.com/oozcitak/xmlbuilder2' },
  { name: 'class-validator', version: '^0.14', license: 'MIT', licenseColor: 'success', url: 'https://github.com/typestack/class-validator' },
  { name: 'class-transformer', version: '^0.5', license: 'MIT', licenseColor: 'success', url: 'https://github.com/typestack/class-transformer' },
  // Infrastructure
  { name: 'PostgreSQL', version: '15+', license: 'PostgreSQL', licenseColor: 'primary', url: 'https://postgresql.org' },
  { name: 'Node.js', version: '^20', license: 'MIT', licenseColor: 'success', url: 'https://nodejs.org' },
  { name: 'TypeScript', version: '^5', license: 'Apache-2.0', licenseColor: 'info', url: 'https://typescriptlang.org' },
  { name: 'Vite', version: '^6', license: 'MIT', licenseColor: 'success', url: 'https://vitejs.dev' },
]
</script>

<style scoped>
.about-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.6) 100%);
  color: white;
}

.about-logo {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.3);
  flex-shrink: 0;
}

.about-logo-text {
  font-size: 1.6rem;
  font-weight: 900;
  color: white;
  letter-spacing: -0.05em;
}

.privacy-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.78rem;
}

.privacy-item {
  display: flex;
  align-items: flex-start;
  line-height: 1.5;
}
</style>
