<template>
  <v-container class="fill-height bg-surface" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4" class="text-center">
        <v-icon
          icon="mdi-shield-lock-outline"
          size="100"
          color="warning"
          class="mb-6"
        ></v-icon>
        
        <h1 class="text-h3 font-weight-bold mb-4">Eingeschränkter Zugriff</h1>
        
        <p class="text-h6 text-medium-emphasis mb-8">
          Dieses Feature ist aus Sicherheitsgründen nur auf **autorisierten Club-Geräten** (z.B. dem Kassen-Terminal) verfügbar.
        </p>

        <v-card variant="outlined" class="mb-8 pa-4 text-left border-warning">
          <v-list lines="two" bg-color="transparent">
            <v-list-item
              prepend-icon="mdi-information-outline"
              title="Warum sehe ich das?"
              subtitle="Sensible Bereiche wie die Kasse oder Mitgliederdaten sind auf verifizierte Hardware beschränkt."
            ></v-list-item>
            <v-list-item
              prepend-icon="mdi-cellphone-link-off"
              title="Persönliche Geräte"
              subtitle="Dein privates Handy oder Laptop ist standardmäßig nicht für diese Funktionen freigeschaltet."
            ></v-list-item>
          </v-list>
        </v-card>

        <div class="d-flex flex-column gap-3">
          <v-btn
            color="primary"
            size="large"
            rounded="xl"
            prepend-icon="mdi-key-chain"
            to="/activate-device"
            block
          >
            Gerät jetzt autorisieren
          </v-btn>
          
          <v-btn
            variant="text"
            color="medium-emphasis"
            to="/dashboard"
            class="mt-2"
          >
            Zurück zum Dashboard
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.gap-3 {
  gap: 12px;
}
.border-warning {
  border-color: rgba(var(--v-theme-warning), 0.3) !important;
}
</style>
