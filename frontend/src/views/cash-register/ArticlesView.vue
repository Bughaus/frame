<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-package-variant</v-icon>
      <h1 class="text-h4 font-weight-bold ml-1">{{ t('articles.title') }}</h1>
      <v-spacer></v-spacer>
      <div>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()" class="mr-1">
          {{ t('articles.newArticle') }}
        </v-btn>
      </div>
    </div>
    
    <v-row>
      <v-col cols="12">
        <v-card class="elevation-1">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            :label="t('common.search')"
            single-line
            hide-details
            class="pa-4"
          ></v-text-field>
          <v-data-table
            :headers="headers"
            :items="articles"
            :search="search"
            :loading="loading"
            item-value="id"
            hover
            class="bg-transparent"
            :no-data-text="t('common.noData')"
            v-model:sort-by="sortByTable"
          >
            <template #item.image="{ item }">
              <v-avatar size="36" rounded="lg" class="my-1 border" color="surface-variant">
                <v-img v-if="item.imageUrl" :src="getImageUrl(item.imageUrl)" cover eager></v-img>
                <v-icon v-else color="primary" size="small">{{ item.icon || 'mdi-food-apple' }}</v-icon>
              </v-avatar>
            </template>
            <template #item.sortOrder="{ item }">
              <v-chip size="x-small" label color="grey-lighten-2" class="font-weight-bold text-grey-darken-3">{{ item.sortOrder }}</v-chip>
            </template>
            <template #item.sku="{ item }">
              <span class="text-caption">{{ item.sku }}</span>
            </template>
            <template #item.category="{ item }">
              <v-chip size="x-small" variant="tonal" class="text-uppercase">{{ item.category || 'Keine' }}</v-chip>
            </template>
            <template #item.name="{ item }">
              <span class="font-weight-medium">{{ item.name }}</span>
            </template>
            <template #item.price="{ item }">
              <span class="text-primary font-weight-bold">{{ Number(item.price).toFixed(2) }}€</span>
            </template>
            <template #item.actions="{ item }">
                <div class="d-flex justify-end">
                <v-btn icon size="x-small" variant="text" color="primary" @click="editItem(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="x-small" variant="text" color="primary" @click="triggerImageUpload(item.id)">
                  <v-icon>mdi-camera</v-icon>
                </v-btn>
                <v-btn icon="mdi-delete" size="x-small" color="error" variant="text" @click="deleteArticle(item.id)"></v-btn>
              </div>
            </template>
          </v-data-table>
          <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
          <v-icon class="mr-2">{{ editedItem.id ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
          <span class="text-h5">{{ editedItem.id ? t('articles.editArticle') : t('articles.newArticle') }}</span>
        </v-card-title>
        <v-card-text class="pt-6">
          <v-text-field v-model="editedItem.sku" :label="t('articles.sku')" variant="outlined" density="compact"></v-text-field>
          <v-text-field v-model="editedItem.name" :label="t('articles.name')" variant="outlined" density="compact"></v-text-field>
          <v-combobox v-model="editedItem.category" :items="categories" :label="t('articles.category')" variant="outlined" density="compact"></v-combobox>
          <v-row dense>
            <v-col cols="8">
              <v-text-field v-model.number="editedItem.price" type="number" :label="`${t('articles.price')} (€)`" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field v-model.number="editedItem.sortOrder" type="number" :label="t('articles.sort')" variant="outlined" density="compact"></v-text-field>
            </v-col>
          </v-row>
          
          <div class="text-subtitle-2 mb-2">{{ t('articles.chooseIcon') }}</div>
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
        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false" class="mr-2">{{ t('common.cancel') }}</v-btn>
          <v-btn color="primary" variant="elevated" @click="save" :loading="saving" prepend-icon="mdi-check" class="px-6">{{ t('common.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Hidden file input for image upload -->
    <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="handleImageUpload" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from '../../composables/useConfirm'
import { articlesApi, type Article } from '../../api/cash-register'
import { api } from '../../api/axios'

const { t } = useI18n()
const { confirm } = useConfirm()
const articles = ref<Article[]>([])
const search = ref('')
const loading = ref(false)

const headers = computed(() => [
  { title: t('articles.image'), key: 'image', sortable: false, width: '60px' },
  { title: t('articles.sort'), key: 'sortOrder', width: '80px' },
  { title: t('articles.sku'), key: 'sku' },
  { title: t('articles.category'), key: 'category' },
  { title: t('articles.name'), key: 'name' },
  { title: t('articles.price'), key: 'price' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const }
])

const sortByTable = ref<any[]>([])
const categories = computed(() => {
  const cats = articles.value.map(a => a.category).filter((c): c is string => !!c)
  return [...new Set(cats)].sort()
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
    alert(t('articles.saveError'))
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
    alert(t('articles.uploadError'))
  }
  
  // Reset file input
  if (fileInput.value) fileInput.value.value = ''
}

async function deleteArticle(id: string) {
  if (await confirm(t('common.confirm'), t('articles.deleteConfirm'))) {
    await articlesApi.remove(id)
    load()
  }
}

onMounted(() => load())
</script>


