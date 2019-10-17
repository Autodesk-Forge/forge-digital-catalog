<template>
  <div>
    <v-alert
      v-model="alert"
      dismissible
      type="error"
    >
      {{ alertMessage }}
    </v-alert>
    <div
      ref="forgeViewer"
      class="forgeViewer"
    />
    <animationPanel v-if="this.$store.state.featureToggles.animation" />
  </div>
</template>

<script>
import animationPanel from './AnimationPanel.vue'
import config from './../../config'

export default {
    components: {
        animationPanel
    },
    data() {
        return {
            alert: false,
            alertMessage: '',
            documentId: '',
            viewer: null,
            viewerConfig: {
                extensions: ['Autodesk.Fusion360.Animation']
            }
        }
    },
    watch: {
        documentId: 'loadDocument'
    },
    mounted: async function () {
        const vm = this
        this.$root.$on('selectedCatalogItem', async function (e) {
            this.$log.info('... received selectedCatalogItem event')
            if (this.$store.state.selectedCatalog.length > 0) {
                const res = await this.$axios({
                    method: 'GET',
                    url: new URL(`/api/catalog/file/id/${this.$store.state.selectedCatalog[0]}`, config.koahost).href
                })
                if (res.status === 200 && res.data.svfUrn) {
                    this.$store.dispatch('setShowCatalogTree', false)
                    this.$root.$emit('clearStoryboards')
                    this.$store.dispatch('setSvfUrn', res.data.svfUrn)
                    const options = {
                        viewerScriptURL: config.viewerScriptURL,
                        viewerCSSURL: config.viewerCSSURL,
                        getAccessToken: async (onGetAccessToken) => {
                            try {
                                const res2 = await this.$axios({
                                    method: 'GET',
                                    url: new URL('/api/forge/authenticate/viewer', config.koahost).href + `?sb=${e[0]}`
                                })
                                if (res2.status === 200) {
                                    vm.$store.dispatch('setViewerToken', res2.data.access_token)
                                    onGetAccessToken(res2.data.access_token, 86400)
                                }
                            } catch (err) {
                                this.alert = true
                                this.alertMessage = err
                            }
                        },
                        env: 'AutodeskProduction'
                    }
                vm.initViewer(options, (await caches.keys()).includes(e[0]) && !(await caches.keys()).includes('Forge-Digital-Catalog'))
              }
            }
        })
        this.$root.$on('selectedStoryboard', function () {
            this.$log.info('... received selectedStoryboard event')
            if (this.$store.state.selectedStoryboard) {
                vm.clearModelInViewer()
                vm.loadModel(this.$store.state.selectedStoryboard.path)
            }
        })
    },
    methods: {
        initViewer(options, forceLoad){
          return Promise.all([new Promise((resolve, reject) => {
           if(!forceLoad&&typeof Autodesk == 'object'&&Autodesk.Viewing)resolve()
            else{
            const link  = document.createElement('link')
             link.rel  = 'stylesheet'
             link.type = 'text/css'
             link.href = options.viewerCSSURL
             link.onload = () => resolve()
             document.head.append(link)
           }
           }), new Promise((resolve, reject) => {
             if(!forceLoad&&typeof Autodesk == 'object'&&Autodesk.Viewing)resolve()
             else{
               const script = document.createElement('script')
               script.onload = () => resolve()
               script.src = options.viewerScriptURL
               document.head.append(script)
             }
           })]).then(() => {
             Autodesk.Viewing.Initializer(options, this.onInitialized)
             this.$store.dispatch('setShowCatalogTree', true)
             return
           })
        },
        clearModelInViewer () {
            try {
                if (this.viewer.model) {
                    this.$log.info('... unloading current model from Autodesk Viewer')
                    this.viewer.finish()
                    this.viewer = new Autodesk.Viewing.Private.GuiViewer3D(this.$refs.forgeViewer, {extensions:['Autodesk.Fusion360.Animation']})
                    this.viewer.start()
                }
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            }
        },
        clearViewer () {
            try {
                if (this.viewewr != null) {
                    this.viewer.finish()
                }
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            }
        },
        async getStoryBoardImageDataUri (doc, storyboard) {
            try {
                const urn = doc.myPath.replace('urn:', '')
                const res = await this.$axios({
                    method: 'GET',
                    url: new URL(`/api/fusion/thumbnail/${urn}`, config.koahost).href
                })
                if (res.status === 200) {
                    return res.data
                }
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            }
        },
        loadDocument () {
            try {
                this.documentId = `urn:${this.$store.state.svfUrn}`
                Autodesk.Viewing.Document.load(
                    this.documentId,
                    this.onDocumentLoadSuccess,
                    this.onDocumentLoadFailure
                )
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            }
        },
        loadModel (path) {
            try {
                this.viewer.loadModel(path, {}, this.onModelLoaded)
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            }
        },
        onDocumentLoadFailure (viewerErrorCode) {
            this.$log.error(`onDocumentLoadFailure() - errorCode: ${viewerErrorCode}`)
        },
        async onDocumentLoadSuccess (doc) {
            try {
                await this.selectItem(doc)
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            }
        },
        onInitialized () {
            try {
                this.clearViewer()
                this.viewer = new Autodesk.Viewing.Private.GuiViewer3D(this.$refs.forgeViewer, {extensions:['Autodesk.Fusion360.Animation']})
                this.viewer.start()
                this.loadDocument()
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            }
        },
        onItemLoadFail (errorCode) {
            this.$log.error(`onItemLoadFail() - errorCode: ${errorCode}`)
        },
        async onItemLoadSuccess (locViewer, viewables) {
            try {
                this.$log.info('... model loaded')
                await locViewer.loadExtension('Autodesk.Fusion360.Animation')
                this.$log.info('... Fusion360 Animation Extension loaded')
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            }
        },
        onModelLoaded (model) {
            this.viewer.restoreState({
                'viewport': {
                    'projection': 'perspective',
                    'isOrthographic': false
                }
            })
            return
        },
        async selectItem (doc) {
            try {
                await this.viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry())
                this.setAnimations(doc)
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            }
        },
        async setAnimations(doc, path) {
            try {
                this.$store.dispatch('setSaving', { animations: true })
                const subFolders = doc.getRoot().search( {
                        role: 'animation',
                        type: 'folder'
                    },
                    true
                )
                let animations = []
                if (subFolders.length) {
                const children = subFolders[0].children
                animations = await Promise.all(children.map(async (id, i) => {
                    const subModel = children[i]
                    const imageDataUri = await this.getStoryBoardImageDataUri(doc,subModel)
                    const viewablePath = doc.getViewablePath(subModel)
                    return Promise.resolve({
                        imageDataUri,
                        name: id.name(),
                        path: viewablePath
                    })
                }))
              }
                this.$store.dispatch('setAnimations', animations)
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            } finally {
                this.$store.dispatch('setSaving', { animations: false })
                this.$root.$emit('setAnimations', this.$store.state.animations)
            }
        }
    }
}
</script>

<style>
.forgeViewer {
  position: relative;
  width: 100%;
  height: 600px;
  margin: 0;
  background-color: #dcdcdc;
}
</style>
