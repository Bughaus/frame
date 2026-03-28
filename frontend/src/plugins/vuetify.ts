import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

const vereinTheme = {
  dark: false,
  colors: {
    primary: '#1B5E20',
    'on-primary': '#FFFFFF',
    secondary: '#4E342E',
    'on-secondary': '#FFFFFF',
    accent: '#FFD600',
    error: '#C62828',
    warning: '#E65100',
    info: '#0277BD',
    success: '#2E7D32',
    background: '#FAFAF5',
    'on-background': '#1A1A1A',
    surface: '#FFFFFF',
    'on-surface': '#1A1A1A',
    'surface-variant': '#E8F5E9',
    'on-surface-variant': '#1B5E20', // Dark green text on light green variant
  }
}

const vereinDarkTheme = {
  dark: true,
  colors: {
    primary: '#66BB6A',
    'on-primary': '#000000',
    secondary: '#A1887F',
    'on-secondary': '#000000',
    accent: '#FFD600',
    error: '#EF5350',
    warning: '#FF9800',
    info: '#29B6F6',
    success: '#66BB6A',
    background: '#0D1B0F',
    'on-background': '#E8F5E9',
    surface: '#1A2E1C',
    'on-surface': '#E8F5E9',
    'surface-variant': '#2E4830',
    'on-surface-variant': '#C8E6C9', // Light green text on dark green variant
  }
}

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'vereinTheme',
    themes: {
      vereinTheme,
      vereinDarkTheme,
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
})
