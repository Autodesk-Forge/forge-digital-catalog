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
        </v-col>
      </template>
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
          <div v-if="item.title.indexOf($t('catalog.createFolder'))!==-1">
            <v-list-item-content>
              <v-list-item-title @click="createDialog = !createDialog">
                {{ item.title }}
              </v-list-item-title>
            </v-list-item-content>
          </div>
          <div v-else-if="item.title.indexOf($t('catalog.deleteFolder'))!==-1">
            <v-list-item-content>
              <v-list-item-title @click="deleteDialog = !deleteDialog">
                {{ item.title }}
              </v-list-item-title>
            </v-list-item-content>
          </div>
          <div v-else-if="item.title.indexOf($t('catalog.renameFolder'))!==-1">
            <v-list-item-content>
              <v-list-item-title @click="renameFolderDialog = !renameFolderDialog">
                {{ item.title }}
              </v-list-item-title>
            </v-list-item-content>
          </div>
          <div v-else-if="item.title.indexOf($t('catalog.deleteFile'))!==-1">
            <v-list-item-content>
              <v-list-item-title @click="deleteFileDialog = !deleteFileDialog">
                {{ item.title }}
              </v-list-item-title>
            </v-list-item-content>
          </div>
          <div v-else-if="item.title.indexOf($t('catalog.downloadGltf'))!==-1">
            <v-list-item-content>
              <v-list-item-title @click="downloadGltfFileDialog = !downloadGltfFileDialog">
                {{ item.title }}
              </v-list-item-title>
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
        <v-card-title>{{ $t('catalog.createFolder') }}</v-card-title>
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
            {{ $t('general.save') }}
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="createDialog=false"
          >
            {{ $t('general.cancel') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="deleteDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>{{ $t('catalog.deleteFolder') }}</v-card-title>
        <v-card-text>
          <div>
            <div>{{ $t('general.confirmDelete') }}</div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            text
            @click="() => { deleteDialog=false; deleteFolder(contextItem) }"
          >
            {{ $t('general.accept') }}
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="deleteDialog=false"
          >
            {{ $t('general.cancel') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="renameFolderDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>{{ $t('catalog.renameFolder') }}</v-card-title>
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
            {{ $t('general.accept') }}
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="renameFolderDialog=false"
          >
            {{ $t('general.cancel') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="deleteFileDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>{{ $t('catalog.deleteFile') }}</v-card-title>
        <v-card-text>
          <div>
            <div>{{ $t('general.confirmDelete') }}</div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            text
            @click="() => { deleteFileDialog=false; deleteFile(contextItem) }"
          >
            {{ $t('general.accept') }}
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="deleteFileDialog=false"
          >
            {{ $t('general.cancel') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="downloadGltfFileDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>{{ $t('catalog.downloadGltf') }}</v-card-title>
        <v-card-actions>
          <v-btn
            color="primary"
            text
            @click="() => { downloadGltfFileDialog=false; downloadGltfFiles(contextItem) }"
          >
            {{ $t('general.accept') }}
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="downloadGltfFileDialog=false"
          >
            {{ $t('general.cancel') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang='ts'>
import Filter from 'bad-words';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { IItem } from '../../shared/tree';
import config from '../config';

const filter = new Filter();

@Component
export default class CatalogTree extends Vue {

  protected active: string[] = [];
  protected alert: boolean = false;
  protected alertMessage: string = '';
  protected caseSensitive: boolean = false;
  protected catalog: string[] = [];
  protected checkedValues: any = {};
  protected contextItem: any;
  protected createDialog: boolean = false;
  protected currentMenuOptions: any = {};
  protected currentParent: string = '';
  protected deleteDialog: boolean = false;
  protected deleteFileDialog: boolean = false;
  protected downloadGltfFileDialog: boolean = false;
  protected folderName: string = '';
  protected folderPath: string = '';
  protected maximumFolderLength: number = 30;
  protected menuoptions: any = {};
  protected open: string[] = [];
  protected renameFolderDialog: boolean = false;
  protected selectedCatalog: string[] = [];
  protected showMenu: boolean = false;
  protected search: string = '';

  // computed properties
  get items(): [any] {
    return [{
      children: this.catalog,
      folderName: this.folderName,
      folderPath: this.folderPath,
      id: 1,
      name: 'Root Folder',
      path: null,
      type: 'folder'
    }];
  }

  get filter(): ((item: any, search: string, textKey: string) => boolean) | undefined {
    return this.caseSensitive
      ? ((item: any, search: string, textKey: string) => item[textKey].indexOf(search) > -1)
      : undefined;
  }

  get selected(): any {
    if (!this.active.length) { return undefined; }
    const id = this.active[0];
    return this.catalog.find((item: any) => item.id === id);
  }

  get showTree(): boolean {
    return this.$store.state.showCatalogTree;
  }

  // lifecycles
  mounted(): void {
    this.menuoptions = {
      file: [{ title: this.$t('catalog.deleteFile') }, { title: this.$t('catalog.downloadGltf') }],
      folder: [{ title: this.$t('catalog.createFolder') }, { title: this.$t('catalog.deleteFolder') }, { title: this.$t('catalog.renameFolder') }],
      items: [{ title: this.$t('catalog.createFolder') }, { title: this.$t('catalog.deleteFolder') }]
    };
  }

  @Watch('selectedCatalog')
  onSelectedCatalogChange(catalog: any) {
    const vm = this;
    setTimeout(() => {
      vm.$store.dispatch('setSelectedCatalog', catalog);
      vm.$root.$emit('selectedCatalogItem', catalog);
    }, 100);
  }

  // methods

  protected anySelected(itemID: string): boolean {
    if (this.selectedCatalog.length > 0 && this.selectedCatalog[0] !== itemID) {
      return true;
    }
    return false;
  }

  protected async deleteFile(item: any): Promise<void> {
    try {
      const res = await this.$axios({
        data: {
          isFile: true,
          name: item.name,
          path: item.path
        },
        method: 'DELETE',
        url: new URL('/api/catalog/file', config.koahost).href
      });
      if (res.status === 200) {
        this.$log.info('... successfully deleted catalog item.');
        // may want to refresh the tree
        await this.refreshParent(this.folderPath);
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  protected async deleteFolder(item: any): Promise<void> {
    try {
      this.folderName = item.name;
      const res = await this.$axios({
        data: {
          isFile: false,
          name: this.$store.state.selectedCatalog.name,
          path: this.$store.state.selectedCatalog.path
        },
        method: 'DELETE',
        url: new URL('/api/catalog/folder', config.koahost).href
      });
      if (res.status === 200) {
        this.$log.info('... successfully deleted ' + this.folderName);
        this.$log.info('... successfully deleted ' + this.folderName);
        // may want to refresh the tree
        // following would work if i could do recursive find.
        this.refreshParent(this.folderPath);
      }
      this.folderName = '';
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  protected async downloadGltfFiles(item: IItem): Promise<void> {
    try {
      const res = await this.$axios({
        method: 'GET',
        url: new URL(`/api/catalog/file/id/${item.id}`, config.koahost).href
      });
      if (res.status === 200) {
        const downloadRes = await this.$axios({
          method: 'GET',
          responseType: 'blob',
          url: new URL(
            `/api/oss/download/gltf/bucket/${res.data.gltf.bucketKey}/object/${res.data.gltf.objectKey}`,
            config.koahost
          ).href
        });
        if (downloadRes.status === 200) {
          const url = window.URL.createObjectURL(new Blob([downloadRes.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', res.data.gltf.objectKey);
          document.body.appendChild(link);
          link.click();
        }
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  protected async renameFolder(item: any): Promise<void> {
    let modifiedName = filter.clean(this.folderName);
    modifiedName = modifiedName.length > this.maximumFolderLength
      ? modifiedName.substring(0, this.maximumFolderLength)
      : modifiedName;
    this.$log.debug('... New Name is:' + modifiedName);
    try {
      const oldName = this.$store.state.selectedCatalog.name;
      const res = await this.$axios({
        data: {
          name: this.$store.state.selectedCatalog.name,
          newName: modifiedName,
          path: this.$store.state.selectedCatalog.path
        },
        method: 'PATCH',
        url: new URL('/api/catalog/folder', config.koahost).href
      });
      if (res.status === 200) {
        this.$log.info(`... successfully renamed ${oldName} to ${modifiedName}`);
        await this.refreshParentAfterRename(this.folderPath, oldName, modifiedName);
      }
      this.folderName = '';
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  protected async saveNewFolder(parent: string): Promise<void> {
    let modifiedName = filter.clean(this.folderName);
    modifiedName = modifiedName.length > this.maximumFolderLength
      ? modifiedName.substring(0, this.maximumFolderLength)
      : modifiedName;
    this.$log.debug('... New Name is:' + modifiedName);
    try {
      this.$store.dispatch('setSaving', { newCatalogFolder: true });
      const res = await this.$axios({
        data: {
          isFile: false,
          isPublished: false,
          name: modifiedName,
          path: this.folderPath
        },
        method: 'POST',
        url: new URL('/api/catalog/folder', config.koahost).href
      });
      if (res.status === 200) {
        this.$log.info('... New catalog folder has been saved.');
        this.refreshChildren(parent);
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setSaving', { newCatalogFolder: false });
      // blank out the folder name for the next creation.
      this.folderName = '';
    }
  }

  protected selectedCatalogChanged(e: any): void {
    // const id = e.target.value
  }

  protected showContextMenu(e: any, item: any): void {
    if (item.path === null) {
      this.folderPath = `,${item.name},`;
    } else {
      this.folderPath = `${item.path}${item.name},`;
    }
    if (item.type === 'folder') {
      this.currentMenuOptions = this.menuoptions.folder;
    } else if (item.type === 'file') {
      this.currentMenuOptions = this.menuoptions.file;
    }
    this.currentParent = item.name;
    this.contextItem = item;
    const onPublishMenu = e.target.baseURI.includes('publish');
    if (onPublishMenu) {
      this.$store.dispatch('setSelectedCatalog', item);
      e.preventDefault();
      this.showMenu = false;
      this.menuoptions.x = e.clientX;
      this.menuoptions.y = e.clientY;
      this.$nextTick(() => {
        this.showMenu = true;
      });
    }
  }

  protected up(): void {
    this.$log.info('In up function ...');
  }

  private arrayFind(anArray: any, aName: string): any {
    const foundChild = anArray.find((item: any) => item.name === aName);
    if (foundChild !== undefined) {
      return foundChild;
    }
    for (const anElement in anArray) {
      if (anArray[anElement].children.length > 0) {
        return this.arrayFind(anArray[anElement].children, aName);
      }
    }
  }

  private async fetchCatalog(item: any): Promise<void> {
    try {
      switch (item.type) {
        case 'folder':
          await this.fetchCatalogChildren(item);
          break;
        case 'file':
          break;
        default:
          this.$log.warn('Unknown item type.');
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private async fetchCatalogChildren(item: any): Promise<void> {
    try {
      if (item.path === null) {
        item.path = 'Root Folder';
      }
      const res = await this.$axios({
        method: 'GET',
        url: new URL(`/api/catalog/folder/path/${item.name}`, config.koahost).href
      });
      if (res.status === 200) {
        const data = res.data;
        const children = data.map((val: any) => {
          switch (val.isFile) {
            case true:
              return {
                id: val._id,
                isFile: true,
                isPublished: val.isPublished,
                name: val.name,
                path: val.path,
                type: 'file'
              };
              break;
            case false:
              return {
                children: [],
                id: val._id,
                isFile: false,
                name: val.name,
                path: val.path,
                type: 'folder'
              };
              break;
            default:
              this.$log.warn('Could not determine isFile value!');
              return {};
          }
        });
        const onPublishMenu = this.$route.path.includes('publish');
        const newChildren = children.filter((child: any) => (child.isFile && child.isPublished) || !child.isFile);
        if (onPublishMenu) {
          if (children) {
            item.children.push(...children);
          }
        } else {
          if (newChildren) {
            item.children.push(...newChildren);
          }
        }
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private async refreshChildren(item: any): Promise<void> {
    if (item.children) {
      item.children.length = 0;
      await this.fetchCatalogChildren(item);
    }
  }

  private async refreshParent(parentPath: string): Promise<void> {
    const newPath = parentPath.substring(1, parentPath.length - 1);
    const paths = newPath.split(',');
    const parentName = paths[paths.length - 2];
    const parent = this.arrayFind(this.catalog, parentName);
    if (parent) {
      await this.refreshChildren(parent);
    } else {
      const elementToDelete = this.catalog.findIndex((item: any) => item.name === this.folderName);
      this.$log.info(`... about to delete index: ${elementToDelete}`);
      this.catalog.splice(elementToDelete, 1);
    }
  }

  private async refreshParentAfterRename(parentPath: string, theOldName: string, theNewName: string): Promise<void> {
    this.$log.info(`... refreshing parent folder after rename: ${parentPath}, ${theOldName}, ${theNewName}`);
    const newPath = parentPath.substring(1, parentPath.length - 1);
    const paths = newPath.split(',');
    const parentName = paths[paths.length - 2];
    const parent = this.arrayFind(this.catalog, parentName);
    if (parent) {
      const elementToChange = parent.children.findIndex((item: any) => item.name === theOldName);
      this.$log.info(`... about to change name on index: ${elementToChange}`);
      parent.children[elementToChange].name = theNewName;
      const oldNameWithCommas = `,${theOldName},`;
      const newNameWithCommas = `,${theNewName},`;
      parent.children[elementToChange].path = parent.children[elementToChange].path.replace(
        oldNameWithCommas,
        newNameWithCommas
      );
      await this.refreshChildren(parent.children[elementToChange]);
      await this.fetchCatalog(parent.children[elementToChange]);
    } else {
      const elementToChangeIndex = this.catalog.findIndex((item: any) => item.name === theOldName);
      this.$log.info(`... about to change name on index: ${elementToChangeIndex}`);
      const elementToChange: any = this.catalog[elementToChangeIndex];
      elementToChange.name = theNewName;
      const oldNameWithCommas = `,${theOldName},`;
      const newNameWithCommas = `,${theNewName},`;
      elementToChange.path = elementToChange.path.replace(oldNameWithCommas, newNameWithCommas);
      await this.refreshChildren(this.catalog[elementToChangeIndex]);
      await this.fetchCatalog(this.catalog[elementToChangeIndex]);
    }
  }

}
</script>
