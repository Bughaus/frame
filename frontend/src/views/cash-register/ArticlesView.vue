<template>
  <v-container fluid>
    <v-row class="mb-4">
      <v-col class="d-flex justify-space-between align-center">
        <h1 class="text-h4">Artikelverwaltung</h1>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">Neuer Artikel</v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-card>
          <v-data-table :headers="headers" :items="articles" :loading="loading" class="elevation-1">
            <template #item.image="{ item }">
              <v-avatar size="40" rounded="lg" class="my-1 border" color="surface-variant">
                <v-img v-if="item.imageUrl" :src="getImageUrl(item.imageUrl)" cover eager></v-img>
                <v-icon v-else color="grey">mdi-food-apple</v-icon>
              </v-avatar>
            </template>
            <template #item.price="{ item }">{{ Number(item.price).toFixed(2) }}€</template>
            <template #item.taxRate="{ item }">{{ Number(item.taxRate).toFixed(2) }}%</template>
            <template #item.actions="{ item }">
              <v-btn icon size="small" variant="text" color="primary" @click="editItem(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon size="small" variant="text" color="primary" @click="triggerImageUpload(item.id)">
                <v-icon>mdi-camera</v-icon>
              </v-btn>
              <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="deleteItem(item.id)"></v-btn>
            </template>
          </v-data-table>
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
          <v-text-field v-model.number="editedItem.price" type="number" label="Preis (€)" variant="outlined" density="compact"></v-text-field>
          <v-text-field v-model.number="editedItem.taxRate" type="number" label="MwSt. (%)" variant="outlined" density="compact"></v-text-field>
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
import { ref, onMounted } from 'vue'
import { articlesApi, type Article } from '../../api/cash-register'
import { api } from '../../api/axios'

const headers: any = [
  { title: 'Bild', key: 'image', sortable: false, width: '60px' },
  { title: 'SKU', key: 'sku' },
  { title: 'Kategorie', key: 'category' },
  { title: 'Name', key: 'name' },
  { title: 'Preis', key: 'price' },
  { title: 'MwSt.', key: 'taxRate' },
  { title: 'Aktionen', key: 'actions', sortable: false, align: 'end' },
]

const articles = ref<Article[]>([])
const loading = ref(false)

const dialog = ref(false)
const saving = ref(false)
const defaultItem: Article = { id: '', name: '', sku: '', price: 0, taxRate: 7.0, category: '', isActive: true }
const editedItem = ref<Article>({ ...defaultItem })

const fileInput = ref<HTMLInputElement | null>(null)
const uploadTargetId = ref('')

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
      price: Number(editedItem.value.price),
      taxRate: Number(editedItem.value.taxRate)
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
