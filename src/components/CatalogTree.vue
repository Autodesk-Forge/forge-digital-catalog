<template>
  <v-card>
    <v-sheet class="pa-3 primary lighten-2">
      <v-text-field
        v-model="search"
        label="Search Catalog"
        dark
        flat
        solo-inverted
        hide-details
        clearable
        clear-icon="mdi-close-circle-outline"
      ></v-text-field>
      <v-checkbox v-model="caseSensitive" dark hide-details label="Case sensitive search"></v-checkbox>
    </v-sheet>
    <v-treeview
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
          type="checkbox"
          v-bind:value="item.id"
          v-model="selectedCatalog"
          :disabled="anySelected(item.id)"
        >
        <v-icon
          v-if="!item.children"
          :color="active ? 'primary' : ''"
        >icon-autodesk-volume-icon-gray</v-icon>
      </template>
      <template v-slot:label="{ item }">
        <v-flex @contextmenu="showContextMenu($event, item)">{{item.name}}</v-flex>
      </template>
    </v-treeview>
    <v-menu
      v-model="showMenu"
      :position-x="menuoptions.x"
      :position-y="menuoptions.y"
      absolute
      offset-y
    >
      <v-list>
        <v-list-tile v-for="(item, index) in this.currentMenuOptions" :key="index">
          <div v-if="item.title.indexOf('Create')!==-1">
            <v-list-tile-content>
              <v-list-tile-title v-html="item.title" @click="createDialog = !createDialog"></v-list-tile-title>
            </v-list-tile-content>
          </div>
          <div v-else-if="item.title.indexOf('Delete Folder')!==-1">
            <v-list-tile-content>
              <v-list-tile-title v-html="item.title" @click="deleteDialog = !deleteDialog"></v-list-tile-title>
            </v-list-tile-content>
          </div>
          <div v-else-if="item.title.indexOf('Rename Folder')!==-1">
            <v-list-tile-content>
              <v-list-tile-title
                v-html="item.title"
                @click="renameFolderDialog = !renameFolderDialog"
              ></v-list-tile-title>
            </v-list-tile-content>
          </div>
          <div v-else-if="item.title.indexOf('Delete File')!==-1">
            <v-list-tile-content>
              <v-list-tile-title v-html="item.title" @click="deleteFileDialog = !deleteFileDialog"></v-list-tile-title>
            </v-list-tile-content>
          </div>
        </v-list-tile>
      </v-list>
    </v-menu>
    <v-dialog v-model="createDialog" max-width="500px">
      <v-card>
        <v-card-title>Create Folder</v-card-title>
        <v-card-text>
          <v-text-field label="Folder Name" v-model="folderName" @input="up"></v-text-field>
          <v-text-field label="Path" v-model="folderPath" :readonly="true"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            flat
            @click="() => { createDialog=false; saveNewFolder(contextItem) }"
          >Save</v-btn>
          <v-btn color="primary" flat @click="createDialog=false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="deleteDialog" max-width="500px">
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
            flat
            @click="() => { deleteDialog=false; deleteFolder(contextItem) }"
          >OK</v-btn>
          <v-btn color="primary" flat @click="deleteDialog=false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="renameFolderDialog" max-width="500px">
      <v-card>
        <v-card-title>Rename Folder</v-card-title>
        <v-card-text>
          <v-text-field label="New Folder Name" v-model="folderName" @input="up"></v-text-field>
          <v-text-field label="Path" v-model="folderPath" :readonly="true"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            flat
            @click="() => { renameFolderDialog=false; renameFolder(contextItem) }"
          >OK</v-btn>
          <v-btn color="primary" flat @click="renameFolderDialog=false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="deleteFileDialog" max-width="500px">
      <v-card>
        <v-card-title>Delete File</v-card-title>
        <v-card-text>
          <div>
            <div>Are you sure you want to delete {{this.$store.state.selectedCatalog.name}}?</div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            flat
            @click="() => { deleteFileDialog=false; deleteFile(contextItem) }"
          >OK</v-btn>
          <v-btn color="primary" flat @click="deleteFileDialog=false">Cancel</v-btn>
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

let filter = new Filter()

export default {
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
  data: () => ({
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
  methods: {
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
  },
  watch: {
    selectedCatalog(catalog) {
      this.$store.dispatch('setSelectedCatalog', catalog)
      this.$root.$emit('selectedCatalogItem')
    }
  }
}
</script>
