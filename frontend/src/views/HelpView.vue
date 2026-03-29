<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-help-circle-outline</v-icon>
      <h1 class="text-h3 font-weight-bold">Hilfe & Anleitungen</h1>
    </div>

    <v-row>
      <v-col cols="12" md="8">
        <v-expansion-panels variant="accordion">
          <!-- Basic Member Help (Always visible) -->
          <v-expansion-panel elevation="1">
            <v-expansion-panel-title class="font-weight-bold">
              <v-icon start color="primary">mdi-silverware</v-icon>
              Wie buche ich Getränke oder Snacks (Verzehr)?
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              Gehe auf den Menüpunkt <strong>Verzehr</strong>. Dort siehst du dein aktuelles Guthaben und eine Liste aller verfügbaren Artikel. 
              Klicke einfach auf einen Artikel, um ihn in deinen Warenkorb zu legen. Wenn du fertig bist, klicke auf "Jetzt Buchen".
              Der Betrag wird sofort von deinem Konto abgezogen.
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel elevation="1">
            <v-expansion-panel-title class="font-weight-bold">
              <v-icon start color="primary">mdi-contactless-payment</v-icon>
              Wie funktioniert die Anmeldung per RFID?
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              Du kannst dich im Vereinsheim einfach durch Auflegen deines RFID-Chips am Terminal anmelden oder identifizieren. 
              Falls dein Chip noch nicht registriert ist, wende dich bitte an einen Vorstand oder Mitarbeiter, um ihn in deinem Profil zu hinterlegen.
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel elevation="1">
            <v-expansion-panel-title class="font-weight-bold">
              <v-icon start color="primary">mdi-clock-outline</v-icon>
              Arbeitsdienst und Stunden erfassen
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              Unter dem Punkt <strong>Stunden</strong> kannst du deine geleisteten Arbeitsstunden für den Verein eintragen. 
              Wähle das Datum, die Dauer und eine kurze Beschreibung deiner Tätigkeit. Diese Stunden werden nach Prüfung durch den Vorstand angerechnet.
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel elevation="1">
            <v-expansion-panel-title class="font-weight-bold">
              <v-icon start color="primary">mdi-wallet-outline</v-icon>
              Finanzen und Rechnungen
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              Im Bereich <strong>Finanzen</strong> findest du eine Übersicht über all deine Buchungen und deine monatlichen Abrechnungen. 
              Du kannst dort auch deine Rechnungen als PDF herunterladen. Offene Beträge werden in der Regel per Lastschrift eingezogen oder können bar ausgeglichen werden.
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Staff/Vorstand Management Help -->
          <v-expansion-panel elevation="1" v-if="authStore.hasRole(['VORSTAND', 'MITARBEITER'])">
            <v-expansion-panel-title class="font-weight-bold text-primary">
              <v-icon start color="primary">mdi-cash-register</v-icon>
              Bedienung der Event Kasse (für Personal)
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              Die <strong>Event Kasse</strong> ist für den direkten Verkauf an Mitglieder und Gäste gedacht. 
              1. Wähle das Mitglied über die Suche oder einen Gast-Slot aus. 
              2. Scanne oder wähle die Artikel. 
              3. Schließe die Buchung ab. Bei Gästen muss der Betrag am Ende des Abends abgerechnet werden.
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel elevation="1" v-if="authStore.hasRole(['VORSTAND', 'MITARBEITER'])">
            <v-expansion-panel-title class="font-weight-bold text-primary">
              <v-icon start color="primary">mdi-account-group</v-icon>
              Mitglieder- und RFID-Verwaltung
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              In der <strong>Mitgliederverwaltung</strong> können Daten gepflegt und RFID-Links erstellt werden. 
              Um einen RFID-Chip zuzuweisen, wähle "RFID anlernen" beim Mitglied und halte den Chip an das Lesegerät.
              Änderungsanträge von Mitgliedern erscheinen in der <strong>Inbox</strong>.
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel elevation="1" v-if="authStore.hasRole(['VORSTAND'])">
            <v-expansion-panel-title class="font-weight-bold text-primary">
              <v-icon start color="primary">mdi-bank</v-icon>
              Vereinskasse & Buchhaltung (Vorstand)
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              Die <strong>Vereinskasse</strong> zeigt die kumulierten Salden des gesamten Vereins. 
              Unter <strong>Buchungen</strong> können manuelle Korrekturbuchungen, Einzahlungen oder Auszahlungen vorgenommen werden.
              In der <strong>Inbox</strong> können Feedback-Anfragen direkt beantwortet werden.
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="2" class="bg-surface-variant">
          <v-card-title>Kontakt & Support</v-card-title>
          <v-card-text>
            <p class="mb-4">Bei technischen Problemen oder Fehlern wende dich bitte an:</p>
            <v-list density="compact" class="bg-transparent">
              <v-list-item prepend-icon="mdi-email-outline" title="support@verein.de"></v-list-item>
              <v-list-item prepend-icon="mdi-account-tie" title="Ansprechpartner: Michael"></v-list-item>
            </v-list>
            <v-alert type="info" variant="tonal" density="compact" class="mt-4">
              Feedback und Verbesserungsvorschläge kannst du direkt über die Feedback-Funktion auf dem Verzehr-Dashboard senden.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth.store'
const authStore = useAuthStore()
</script>
