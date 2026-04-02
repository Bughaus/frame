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
            density="compact"
            variant="solo"
            class="mb-4 mx-1 elevation-0 border flex-shrink-0"
            style="max-width: 400px"
            clearable
          ></v-text-field>
          <v-table density="compact" hover class="w-100">
            <thead>
                <tr>
                  <th style="width: 40px"></th>
                  <th style="width: 60px">{{ t('articles.image') }}</th>
                  <th style="width: 100px" class="sortable-header" @click="toggleSort('sortOrder')">
                    <div class="d-flex align-center">
                      <span>{{ t('articles.sort') }}</span>
                      <v-icon :icon="sortBy === 'sortOrder' ? (sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up') : 'mdi-arrow-up'" size="x-small" class="sort-icon" :class="{ 'active': sortBy === 'sortOrder' }"></v-icon>
                    </div>
                  </th>
                  <th class="sortable-header" @click="toggleSort('sku')">
                    <div class="d-flex align-center">
                      <span>{{ t('articles.sku') }}</span>
                      <v-icon :icon="sortBy === 'sku' ? (sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up') : 'mdi-arrow-up'" size="x-small" class="sort-icon" :class="{ 'active': sortBy === 'sku' }"></v-icon>
                    </div>
                  </th>
                  <th class="sortable-header" @click="toggleSort('category')">
                    <div class="d-flex align-center">
                      <span>{{ t('articles.category') }}</span>
                      <v-icon :icon="sortBy === 'category' ? (sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up') : 'mdi-arrow-up'" size="x-small" class="sort-icon" :class="{ 'active': sortBy === 'category' }"></v-icon>
                    </div>
                  </th>
                  <th class="sortable-header" @click="toggleSort('name')">
                    <div class="d-flex align-center">
                      <span>{{ t('articles.name') }}</span>
                      <v-icon :icon="sortBy === 'name' ? (sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up') : 'mdi-arrow-up'" size="x-small" class="sort-icon" :class="{ 'active': sortBy === 'name' }"></v-icon>
                    </div>
                  </th>
                  <th class="sortable-header" @click="toggleSort('price')">
                    <div class="d-flex align-center">
                      <span>{{ t('articles.price') }}</span>
                      <v-icon :icon="sortBy === 'price' ? (sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up') : 'mdi-arrow-up'" size="x-small" class="sort-icon" :class="{ 'active': sortBy === 'price' }"></v-icon>
                    </div>
                  </th>
                  <th class="text-right">{{ t('common.actions') }}</th>
                </tr>
            </thead>
            <draggable
              v-model="filteredArticles"
              tag="tbody"
              handle=".drag-handle"
              item-key="id"
              @end="onDragEnd"
              :disabled="search.length > 0 || sortBy !== ''"
            >
              <template #item="{ element }">
                <tr>
                  <td style="width: 40px">
                    <v-btn v-if="sortBy === ''" icon="mdi-drag" variant="text" size="small" class="drag-handle" style="cursor: grab" color="grey"></v-btn>
                    <v-btn v-else icon="mdi-lock-outline" variant="text" size="small" color="grey-lighten-1" disabled></v-btn>
                  </td>
                  <td>
                    <v-avatar size="36" rounded="lg" class="my-1 border" color="surface-variant">
                      <v-img v-if="element.imageUrl" :src="getImageUrl(element.imageUrl)" cover eager></v-img>
                      <v-icon v-else color="primary" size="small">{{ element.icon || 'mdi-food-apple' }}</v-icon>
                    </v-avatar>
                  </td>
                  <td style="width: 80px">
                    <v-chip size="x-small" label color="grey-lighten-2" class="font-weight-bold text-grey-darken-3">{{ element.sortOrder }}</v-chip>
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
                      <v-btn icon="mdi-delete" size="x-small" color="error" variant="text" @click="deleteArticle(element.id)"></v-btn>
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
import draggable from 'vuedraggable'
import { articlesApi, type Article } from '../../api/cash-register'
import { api } from '../../api/axios'

const { t } = useI18n()
const { confirm } = useConfirm()
const articles = ref<Article[]>([])
const search = ref('')
const loading = ref(false)

const sortBy = ref('')
const sortDesc = ref(false)

const toggleSort = (key: string) => {
  if (sortBy.value === key) {
    if (sortDesc.value) {
      sortBy.value = ''
      sortDesc.value = false
    } else {
      sortDesc.value = true
    }
  } else {
    sortBy.value = key
    sortDesc.value = false
  }
}

const filteredArticles = computed({
  get: () => {
    let result = [...articles.value]
    
    // Filtering
    if (search.value) {
      const s = search.value.toLowerCase()
      result = result.filter(a => 
        a.name.toLowerCase().includes(s) || 
        (a.category && a.category.toLowerCase().includes(s)) ||
        (a.sku && a.sku.toLowerCase().includes(s))
      )
    }

    // Sorting
    if (sortBy.value) {
      result.sort((a: any, b: any) => {
        let valA = a[sortBy.value]
        let valB = b[sortBy.value]
        
        if (sortBy.value === 'price') {
          valA = Number(valA)
          valB = Number(valB)
        } else {
          valA = String(valA || '').toLowerCase()
          valB = String(valB || '').toLowerCase()
        }

        if (valA < valB) return sortDesc.value ? 1 : -1
        if (valA > valB) return sortDesc.value ? -1 : 1
        return 0
      })
    }

    return result
  },
  set: (val) => {
    // When search or sort is active, we don't want to allow reordering 
    // because the indexes wouldn't match correctly.
    if (!search.value && !sortBy.value) {
      articles.value = val
    }
  }
})
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

async function onDragEnd() {
  const updates = articles.value.map((article, index) => {
    article.sortOrder = index * 10 // Assign smooth increments
    return { id: article.id, sortOrder: article.sortOrder }
  })
  
  try {
    await articlesApi.reorder(updates)
  } catch (e) {
    console.error('Failed to save sort order', e)
    alert(t('articles.saveError'))
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

<style scoped>
.sortable-header {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.sortable-header:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.sort-icon {
  margin-left: 4px;
  opacity: 0;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.sortable-header:hover .sort-icon {
  opacity: 0.4;
}

.sort-icon.active {
  opacity: 1 !important;
  color: rgb(var(--v-theme-primary)) !important;
}
</style>
