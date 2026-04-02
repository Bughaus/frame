<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-package-variant</v-icon>
      <h1 class="text-h3 font-weight-bold">Artikelstamm</h1>
      <v-spacer></v-spacer>
      <div>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">Neuer Artikel</v-btn>
      </div>
    </div>
    
    <v-row>
      <v-col cols="12">
        <v-card class="elevation-1">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Suchen..."
            single-line
            hide-details
            class="pa-4"
          ></v-text-field>
          <v-table density="compact" hover class="w-100">
            <thead>
              <tr>
                <th style="width: 40px"></th>
                <th style="width: 60px">Bild</th>
                <th style="width: 80px">Sort</th>
                <th>SKU</th>
                <th>Kategorie</th>
                <th>Name</th>
                <th>Preis</th>
                <th class="text-right">Aktionen</th>
              </tr>
            </thead>
            <draggable
              v-model="filteredArticles"
              tag="tbody"
              handle=".drag-handle"
              item-key="id"
              @end="onDragEnd"
              :disabled="search.length > 0"
            >
              <template #item="{ element }">
                <tr>
                  <td style="width: 40px">
                    <v-btn icon="mdi-drag" variant="text" size="small" class="drag-handle" style="cursor: grab" color="grey"></v-btn>
                  </td>
                  <td>
                    <v-avatar size="36" rounded="lg" class="my-1 border" color="surface-variant">
                      <v-img v-if="element.imageUrl" :src="getImageUrl(element.imageUrl)" cover eager></v-img>
                      <v-icon v-else color="primary" size="small">{{ element.icon || 'mdi-food-apple' }}</v-icon>
                    </v-avatar>
                  </td>
                  <td style="width: 80px">
                    <v-chip size="x-small" label color="grey-lighten-3" class="font-weight-bold">{{ element.sortOrder }}</v-chip>
                  </td>
                  <td class="text-caption">{{ element.sku }}</td>
                  <td>
                    <v-chip size="x-small" variant="tonal" class="text-uppercase">{{ element.category || 'Keine' }}</v-chip>
                  </td>
                  <td class="font-weight-medium">{{ element.name }}</td>
                  <td class="text-primary font-weight-bold">
                    {{ Number(element.price).toFixed(2) }}€
                  </td>
                  <td class="text-right">
                    <div class="d-flex justify-end">
                      <v-btn icon size="x-small" variant="text" color="primary" @click="editItem(element)">
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn icon size="x-small" variant="text" color="primary" @click="triggerImageUpload(element.id)">
                        <v-icon>mdi-camera</v-icon>
                      </v-btn>
                      <v-btn icon="mdi-delete" size="x-small" color="error" variant="text" @click="deleteItem(element.id)"></v-btn>
                    </div>
                  </td>
                </tr>
              </template>
            </draggable>
          </v-table>
          <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">
          {{ editedItem.id ? 'Artikel bearbeiten' : 'Neuer Artikel' }}
        </v-card-title>
        <v-card-text class="pt-6">
          <v-text-field v-model="editedItem.name" label="Name" variant="outlined" density="compact"></v-text-field>
          <v-text-field v-model="editedItem.sku" label="SKU / Artikelnummer" variant="outlined" density="compact"></v-text-field>
          <v-text-field v-model="editedItem.category" label="Kategorie (z.B. Getränke)" variant="outlined" density="compact"></v-text-field>
          <v-row dense>
            <v-col cols="8">
              <v-text-field v-model.number="editedItem.price" type="number" label="Preis (€)" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field v-model.number="editedItem.sortOrder" type="number" label="Sortierung" variant="outlined" density="compact" hint="Kleinere Zahl = weiter vorne"></v-text-field>
            </v-col>
          </v-row>
          
          <div class="text-subtitle-2 mb-2">Symbol wählen</div>
          <v-slide-group v-model="editedItem.icon" show-arrows class="border rounded-lg pa-2 bg-surface">
            <v-slide-group-item v-for="icon in flatIcons" :key="icon" :value="icon" v-slot="{ isSelected, toggle }">
              <v-btn
                :color="isSelected ? 'primary' : undefined"
                :variant="isSelected ? 'flat' : 'text'"
                class="ma-1"
                icon
                @click="toggle"
              >
                <v-icon size="large">{{ icon }}</v-icon>
              </v-btn>
            </v-slide-group-item>
          </v-slide-group>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false">Abbrechen</v-btn>
          <v-btn color="primary" variant="flat" @click="save" :loading="saving">Speichern</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Hidden file input for image upload -->
    <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="handleImageUpload" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import draggable from 'vuedraggable'
import { articlesApi, type Article } from '../../api/cash-register'
import { api } from '../../api/axios'

const articles = ref<Article[]>([])
const search = ref('')
const loading = ref(false)

const filteredArticles = computed({
  get: () => {
    if (!search.value) return articles.value
    const s = search.value.toLowerCase()
    return articles.value.filter(a => 
      a.name.toLowerCase().includes(s) || 
      (a.category && a.category.toLowerCase().includes(s)) ||
      (a.sku && a.sku.toLowerCase().includes(s))
    )
  },
  set: (val) => {
    // When search is active, we don't want to allow reordering 
    // because the indexes wouldn't match correctly.
    // Draggable is disabled during search, but v-model needs a setter.
    if (!search.value) {
      articles.value = val
    }
  }
})

const dialog = ref(false)
const saving = ref(false)
const defaultItem: Article = { id: '', name: '', sku: '', price: 0, taxRate: 0, category: '', isActive: true }
const editedItem = ref<Article>({ ...defaultItem })

const fileInput = ref<HTMLInputElement | null>(null)
const uploadTargetId = ref('')

const flatIcons = [
  'mdi-food-apple', 'mdi-glass-cocktail', 'mdi-bottle-soda', 'mdi-beer', 'mdi-glass-wine', 'mdi-water',
  'mdi-coffee', 'mdi-tea', 'mdi-food-variant', 'mdi-cookie', 'mdi-popcorn', 'mdi-candy',
  'mdi-muffin', 'mdi-pizza', 'mdi-billiards', 'mdi-clover', 'mdi-tools', 'mdi-poker-chip',
  'mdi-tag', 'mdi-star', 'mdi-heart'
]

function getImageUrl(path: string | undefined) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${api.defaults.baseURL?.replace('/api/v1', '')}${path}`
}

async function load() {
  loading.value = true
  const allArticles = await articlesApi.getAll()
  articles.value = allArticles.filter(a => a.isActive)
  loading.value = false
}

function openDialog() {
  editedItem.value = { ...defaultItem }
  dialog.value = true
}

function editItem(item: Article) {
  editedItem.value = { ...item, price: Number(item.price), taxRate: Number(item.taxRate) }
  dialog.value = true
}

async function save() {
  saving.value = true
  try {
    const data = {
      sku: editedItem.value.sku,
      name: editedItem.value.name,
      category: editedItem.value.category,
      icon: editedItem.value.icon || 'mdi-food-apple',
      sortOrder: Number(editedItem.value.sortOrder || 0),
      price: Number(editedItem.value.price),
      taxRate: 0
    }

    if (editedItem.value.id) {
      await articlesApi.update(editedItem.value.id, data)
    } else {
      await articlesApi.create(data)
    }
    
    dialog.value = false
    load()
  } catch (e) {
    alert('Fehler beim Speichern')
  }
  saving.value = false
}

async function onDragEnd() {
  const updates = articles.value.map((article, index) => {
    article.sortOrder = index * 10 // Assign smooth increments
    return { id: article.id, sortOrder: article.sortOrder }
  })
  
  try {
    await articlesApi.reorder(updates)
  } catch (e) {
    console.error('Failed to save sort order', e)
    alert('Sortierung konnte nicht gespeichert werden')
    load() // Revert local state on failure
  }
}

function triggerImageUpload(id: string) {
  uploadTargetId.value = id
  fileInput.value?.click()
}

async function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !uploadTargetId.value) return
  
  const formData = new FormData()
  formData.append('image', file)
  
  try {
    await api.post(`/cash-register/articles/${uploadTargetId.value}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    await load()
  } catch (err) {
    alert('Fehler beim Hochladen des Bildes.')
  }
  
  // Reset file input
  if (fileInput.value) fileInput.value.value = ''
}

async function deleteItem(id: string) {
  if (confirm('Artikel wirklich entfernen?')) {
    await articlesApi.remove(id)
    load()
  }
}

onMounted(() => load())
</script>
