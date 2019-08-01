<template>
  <v-card>
    <v-sheet class="pa-3 primary lighten-2">
      <v-text-field
        v-model="search"
        :label="$t('catalog.searchCatalog')"
        dark
        flat
        solo-inverted
        hide-details
        clearable
        clear-icon="mdi-close-circle-outline"
      />
      <v-row justify="space-between">
        <v-checkbox
          v-model="caseSensitive"
          dark
          hide-details
          label="Case sensitive search"
        />
      <!--<v-switch
           color='indigo'
           v-model="catalog_cached"
           @change="catalogCacheChanged"
          label="Cache"
      ></v-switch>-->
      </v-row>
    </v-sheet>
    <v-treeview
      v-if="showTree"
      ref="theCatalogTree"
      checkbox
      :load-children="fetchCatalog"
      :items="items"
      :search="search"
      :filter="filter"
      :open.sync="open"
      class="v-treeview-node__content"
      transition
    >
      <template v-slot:prepend="{ item }">
        <!--v-checkbox @change="onChange" @blur="onChange" ></v-checkbox-->
        <input
          v-model="selectedCatalog"
          type="checkbox"
          :value="item.id"
          :disabled="anySelected(item.id)"
          @input="selectedCatalogChanged"
        >
        <v-icon
          v-if="!item.children"
          :color="active ? 'primary' : ''"
        >
          icon-autodesk-volume-icon-gray
        </v-icon>
      </template>
      <template v-slot:label="{ item }">
        <v-col @contextmenu="showContextMenu($event, item)">
          {{ item.name }}
        <!--  <v-flex v-if="item.children">{{item.name}}</v-flex>
        <v-switch
      v-else
       :value="item.id"
       v-model="cachedIDs"
       @change="viewerCacheChanged($event,item.id)"
      :label="item.name + '('+(cachedIDs.includes(item.id)?'Cached':'Uncached')+')'"
        ></v-switch>
      </v-flex> -->
        </v-col>
      </template>
      <template v-slot:append="{ item }" />
    </v-treeview>
    <v-progress-circular
      v-else
      :size="50"
      indeterminate
    />
    <v-menu
      v-model="showMenu"
      :position-x="menuoptions.x"
      :position-y="menuoptions.y"
      absolute
      offset-y
    >
      <v-list>
        <v-list-item
          v-for="(item, index) in currentMenuOptions"
          :key="index"
        >
          <div v-if="item.title.indexOf('Create')!==-1">
            <v-list-item-content>
              <v-list-item-title
                @click="createDialog = !createDialog"
                v-html="item.title"
              />
            </v-list-item-content>
          </div>
          <div v-else-if="item.title.indexOf('Delete Folder')!==-1">
            <v-list-item-content>
              <v-list-item-title
                @click="deleteDialog = !deleteDialog"
                v-html="item.title"
              />
            </v-list-item-content>
          </div>
          <div v-else-if="item.title.indexOf('Rename Folder')!==-1">
            <v-list-item-content>
              <v-list-item-title
                @click="renameFolderDialog = !renameFolderDialog"
                v-html="item.title"
              />
            </v-list-item-content>
          </div>
          <div v-else-if="item.title.indexOf('Delete File')!==-1">
            <v-list-item-content>
              <v-list-item-title
                @click="deleteFileDialog = !deleteFileDialog"
                v-html="item.title"
              />
            </v-list-item-content>
          </div>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-dialog
      v-model="createDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>Create Folder</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="folderName"
            label="Folder Name"
            @input="up"
          />
          <v-text-field
            v-model="folderPath"
            label="Path"
            :readonly="true"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            text
            @click="() => { createDialog=false; saveNewFolder(contextItem) }"
          >
            Save
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="createDialog=false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="deleteDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>Delete Folder</v-card-title>
        <v-card-text>
          <div>
            <div>Are you sure you want to delete?</div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            text
            @click="() => { deleteDialog=false; deleteFolder(contextItem) }"
          >
            OK
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="deleteDialog=false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="renameFolderDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>Rename Folder</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="folderName"
            label="New Folder Name"
            @input="up"
          />
          <v-text-field
            v-model="folderPath"
            label="Path"
            :readonly="true"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            text
            @click="() => { renameFolderDialog=false; renameFolder(contextItem) }"
          >
            OK
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="renameFolderDialog=false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="deleteFileDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>Delete File</v-card-title>
        <v-card-text>
          <div>
            <div>Are you sure you want to delete {{ this.$store.state.selectedCatalog.name }}?</div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            text
            @click="() => { deleteFileDialog=false; deleteFile(contextItem) }"
          >
            OK
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="deleteFileDialog=false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style>
@import "../../public/css/TreeFormat.css";
</style>

<script>

import Filter from 'bad-words'
import config from './../config'
const Digital_Catalog_Name  = 'Forge-Catalog-Cache'
const Default_Cache_Name = 'Forge-Digital-Catalog'
const catalogCacheOptions = {[Digital_Catalog_Name]:[new RegExp(new URL('/api/catalog/', config.koahost).href.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")+'.*'), new RegExp(new URL('/api/fusion/thumbnail', config.koahost).href.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")+'.*')]}

const derivativeCacheOptions = [new RegExp(/https:\/\/developer\.api\.autodesk\.com\/derivativeservice\/v2\/.*/)]
const viewerCacheOptions = {[Default_Cache_Name]:[new RegExp(/https:\/\/developer\.api\.autodesk\.com\/modelderivative\/v2\/viewers\/.*/),new RegExp(/https:\/\/fonts\.autodesk\.com\/.*/)]}

let filter = new Filter()

export default {
  data:  () => ({
    catalog_cached: false,
    cachedIDs:[],
    active: [],
    alert: false,
    alertMessage: 'No error!',
    caseSensitive: false,
    catalog: [],
    checkedValues: {},
    contextItem: null,
    createDialog: false,
    currentMenuOptions: {},
    currentParent: '',
    deleteDialog: false,
    deleteFileDialog: false,
    folderName: '',
    folderPath: '',
    maximumFolderLength: 30,
    menuoptions: {
      items: [{ title: 'Create Folder' }, { title: 'Delete Folder' }],
      folder: [{ title: 'Create Folder' }, { title: 'Delete Folder' }, { title: 'Rename Folder' }],
      file: [{ title: 'Delete File' }]
    },
    open: [],
    renameFolderDialog: false,
    selectedCatalog: [],
    showMenu: false,
    search: null
  }),
  computed: {
    items() {
      return [
        {
          children: this.catalog,
          id: 1,
          name: 'Root Folder',
          path: null,
          type: 'folder',
          folderName: this.folderName,
          fodlerPath: this.folderPath
        }
      ]
    },
    showTree(){
       return this.$store.state.showCatalogTree
    },
    selected() {
      if (!this.active.length) return undefined
      const id = this.active[0]
      return this.catalog.find(item => item.id === id)
    },
    filter() {
      return this.caseSensitive
        ? (item, search, textKey) => item[textKey].indexOf(search) > -1
        : undefined
    }
  },
  watch: {
    selectedCatalog(catalog) {
      const vm = this
      setTimeout(()=>{
        vm.$store.dispatch('setSelectedCatalog', catalog)
        vm.$root.$emit('selectedCatalogItem', catalog)
      }, 100) //wait for caching options to be posted to service worker
    }
  },
  mounted: async function () {
    // if(!(await navigator.serviceWorker.getRegistrations()).length){
    //   await navigator.serviceWorker.register('/registerServiceWorker.js')
    //   await new Promise(r=>setTimeout(r,1000)) //overcome strange issue where serviceWorker refuses to be immediately available despite claiming all clients in the install phase
    //
    // }
    // this.cachedIDs = await caches.keys()
    // this.catalog_cached = this.cachedIDs.includes(Digital_Catalog_Name)
    //
    // navigator.serviceWorker.controller.postMessage({operation:'OPTIONS', options:{'ADD_ALWAYSCACHE':{  alwaysCache:[Default_Cache_Name]}, 'ADD_CACHEDKEYS':{cachedKeys:viewerCacheOptions}, 'SET_OPTIONS':{options:{debug:true}}}})
    // this.catalogCacheChanged()
  },
  destroyed: function(){
    if(navigator.serviceWorker.controller)
    navigator.serviceWorker.controller.postMessage({operation:'ADD_LOADINGKEYS',loadingKeys:[],clearKeys:true})
  },
  methods: {
    selectedCatalogChanged(e){
      // const id = e.target.value
      // navigator.serviceWorker.controller.postMessage({operation:'OPTIONS', options:{[e.target.checked?'ADD_LOADINGKEYS':'REMOVE_LOADINGKEYS']:{  loadingKeys:[id]}, [this.cachedIDs.includes(id)?'ADD_CACHEDKEYS':'REMOVE_CACHEDKEYS']:{cachedKeys: {[id]:[...derivativeCacheOptions,  new URL('/api/forge/authenticate/viewer', config.koahost).href + `?sb=${id}`] }}}})
    },
    viewerCacheChanged(e,id){
      if(!e.includes(id))
      navigator.serviceWorker.controller.postMessage({operation:'REMOVE_CACHEDKEYS',cachedKeys:{[id]:null}})
    },
    catalogCacheChanged(e){
       navigator.serviceWorker.controller.postMessage(this.catalog_cached?{operation: 'OPTIONS', options:{ ADD_CACHEDKEYS: {cachedKeys:catalogCacheOptions}, ADD_LOADINGKEYS:{loadingKeys:[Digital_Catalog_Name]}}}:{operation:'REMOVE_CACHEDKEYS',cachedKeys:catalogCacheOptions})
    },
    anySelected(itemID) {
      if (this.selectedCatalog.length > 0 && this.selectedCatalog[0] !== itemID) {
        return true
      }
      return false
    },
    arrayFind(anArray, aName) {
      const foundChild = anArray.find(item => item.name == aName)

      if (foundChild != undefined) {
        return foundChild
      }
      for (let anElement in anArray) {
        if (anArray[anElement].children.length > 0) {
          return this.arrayFind(anArray[anElement].children, aName)
        }
      }
    },
    async deleteFile(item) {
      try {
        const res = await this.$axios({
          data: {
            isFile: true,
            name: item.name,
            path: item.path
          },
          method: 'DELETE',
          url: new URL('/api/catalog/file', config.koahost).href
        })
        if (res.status === 200) {
          this.$log.info('... successfully deleted catalog item.')
          // may want to refresh the tree
          await this.refreshParent(this.folderPath)
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      }
    },
    async deleteFolder(item) {
      try {
        this.folderName = item.name
        const res = await this.$axios({
          data: {
            isFile: false,
            name: this.$store.state.selectedCatalog.name,
            path: this.$store.state.selectedCatalog.path
          },
          method: 'DELETE',
          url: new URL('/api/catalog/folder', config.koahost).href
        })
        if (res.status === 200) {
          this.$log.info('... successfully deleted ' + this.folderName)
          this.$log.info('... successfully deleted ' + this.folderName)
          // may want to refresh the tree
          // following would work if i could do recursive find.
          this.refreshParent(this.folderPath)
        }
        this.folderName = ""
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      }
    },
    async fetchCatalog(item) {
      try {
        switch (item.type) {
          case 'folder':
            await this.fetchCatalogChildren(item)
            break
          case 'file':
            break
          default:
            this.$log.warn('Unknown item type.')
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      }
    },
    async fetchCatalogChildren(item) {
      try {
        if (item.path === null) {
          item.path = 'Root Folder'
        }
        const res = await this.$axios({
          method: 'GET',
          url: new URL(`/api/catalog/folder/path/${item.name}`, config.koahost).href
        })
        if (res.status === 200) {
          const data = res.data
          const children = data.map((val, i) => {
            switch (val.isFile) {
              case true:
                return {
                  id: val._id,
                  isFile: true,
                  isPublished: val.isPublished,
                  name: val.name,
                  path: val.path,
                  type: 'file'
                }
                break
              case false:
                return {
                  children: [],
                  id: val._id,
                  isFile: false,
                  name: val.name,
                  path: val.path,
                  type: 'folder'
                }
              default:
                this.$log.warn('Could not determine isFile value!')
            }
          })
          const onPublishMenu = this.$route.path.includes('publish')
          const newChildren = children.filter(child => (child.isFile && child.isPublished) || !child.isFile);
          if (onPublishMenu) {
            if (children) {
              item.children.push(...children)
            }
          } else {
            if (newChildren) {
              item.children.push(...newChildren)
            }
          }
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      }
    },
    async renameFolder(item) {
      var modifiedName = filter.clean(this.folderName)
      modifiedName = modifiedName.length>this.maximumFolderLength ? modifiedName.substring(0,this.maximumFolderLength) : modifiedName
      this.$log.debug('... New Name is:' + modifiedName)

      try {
        const oldName = this.$store.state.selectedCatalog.name
        const res = await this.$axios({
          data: {
            newName: modifiedName,
            name: this.$store.state.selectedCatalog.name,
            path: this.$store.state.selectedCatalog.path
          },
          method: 'PATCH',
          url: new URL('/api/catalog/folder', config.koahost).href
        })
        if (res.status === 200) {
          this.$log.info(`... successfully renamed ${oldName} to ${modifiedName}`)
          await this.refreshParentAfterRename(this.folderPath, oldName, modifiedName)
        }
        this.folderName = ''
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      }
    },
    async saveNewFolder(parent) {
      var modifiedName = filter.clean(this.folderName)
      modifiedName = modifiedName.length>this.maximumFolderLength ? modifiedName.substring(0,this.maximumFolderLength) : modifiedName
      this.$log.debug('... New Name is:' + modifiedName)

      try {
        this.$store.dispatch('setSaving', { newCatalogFolder: true })
        const res = await this.$axios({
          data: {
            isFile: false,
            isPublished: false,
            name: modifiedName,
            path: this.folderPath
          },
          method: 'POST',
          url: new URL('/api/catalog/folder', config.koahost).href
        })
        if (res.status === 200) {
          this.$log.info('... New catalog folder has been saved.')
          this.refreshChildren(parent)
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch('setSaving', { newCatalogFolder: false })
        //blank out the folder name for the next creation.
        this.folderName = ""
      }
    },
    showContextMenu(e, item) {
      if (item.path === null) {
        this.folderPath = `,${item.name},`
      } else {
        this.folderPath = `${item.path}${item.name},`
      }
      if (item.type === 'folder') {
        this.currentMenuOptions = this.menuoptions.folder
      } else if (item.type === 'file') {
        this.currentMenuOptions = this.menuoptions.file
      }
      this.currentParent = item.name
      this.contextItem = item
      const onPublishMenu = e.target.baseURI.includes('publish')
      if (onPublishMenu) {
        this.$store.dispatch('setSelectedCatalog', item)
        e.preventDefault()
        this.showMenu = false
        this.menuoptions.x = e.clientX
        this.menuoptions.y = e.clientY
        this.$nextTick(() => {
          this.showMenu = true
        })
      }
    },
    up() {
      //this.$log.info(filter.clean(this.folderName))
    },
    async refreshChildren(item) {
      if (item.children) {
        item.children.length = 0
        await this.fetchCatalogChildren(item)
      }
    },
    async refreshParent(parentPath) {
      const newPath = parentPath.substring(1, parentPath.length - 1)
      const paths = newPath.split(',')
      const parentName = paths[paths.length - 2]
      const parent = this.arrayFind(this.catalog, parentName)
      if (parent) {
        await this.refreshChildren(parent)
      } else {
        const elementToDelete = this.catalog.findIndex(item => item.name == this.folderName)
        this.$log.info(`... about to delete index: ${elementToDelete}`)
        this.catalog.splice(elementToDelete, 1)
      }
    },
    async refreshParentAfterRename(parentPath, theOldName, theNewName) {
      this.$log.info(`... refreshing parent folder after rename: ${parentPath}, ${theOldName}, ${theNewName}`)
      const newPath = parentPath.substring(1, parentPath.length - 1)
      const paths = newPath.split(',')
      const parentName = paths[paths.length - 2]
      const parent = this.arrayFind(this.catalog, parentName)
      if (parent) {
        const elementToChange = parent.children.findIndex(item => item.name == theOldName)
        this.$log.info(`... about to change name on index: ${elementToChange}`)
        parent.children[elementToChange].name = theNewName
        const oldNameWithCommas = `,${theOldName},`
        const newNameWithCommas = `,${theNewName},`
        parent.children[elementToChange].path = parent.children[elementToChange].path.replace(oldNameWithCommas, newNameWithCommas)
        await this.refreshChildren(parent.children[elementToChange])
        await this.fetchCatalog(parent.children[elementToChange])
      } else {
        const elementToChange = this.catalog.findIndex(item => item.name == theOldName)
        this.$log.info(`... about to change name on index: ${elementToChange}`)
        this.catalog[elementToChange].name = theNewName
        const oldNameWithCommas = `,${theOldName},`
        const newNameWithCommas = `,${theNewName},`
        this.catalog[elementToChange].path = this.catalog[elementToChange].path.replace(oldNameWithCommas, newNameWithCommas)
        await this.refreshChildren(this.catalog[elementToChange])
        await this.fetchCatalog(this.catalog[elementToChange])
      }
    }
  }
}
</script>
