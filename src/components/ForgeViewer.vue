<template>
    <div>
        <v-alert v-model="alert" dismissible type="error">{{alertMessage}}</v-alert>
        <div id="forgeViewer"></div>
        <animationPanel v-if="this.$store.state.featureToggles.animation" />
    </div>
</template>

<script>
import animationPanel from './AnimationPanel.vue'
import config from './../config'
let viewer

export default {
    mounted: async function () {
        const vm = this
        await this.getForgeToken()
        this.$root.$on('selectedCatalogItem', async function () {
            this.$log.info('... received selectedCatalogItem event')
            if (this.$store.state.selectedCatalog.length > 0) {
                const res = await this.$axios({
                    method: 'GET',
                    url: new URL(`/api/catalog/file/id/${this.$store.state.selectedCatalog[0]}`, config.koahost).href
                })
                if (res.status === 200 && res.data.svfUrn) {
                    this.$root.$emit('clearStoryboards')
                    this.$store.dispatch('setSvfUrn', res.data.svfUrn)
                    const options = {
                        accessToken: this.$store.state.viewerToken,
                        env: 'AutodeskProduction'
                    }
                    Autodesk.Viewing.Initializer(options, vm.onInitialized)
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
    components: {
        animationPanel
    },
    data() {
        return {
            alert: false,
            alertMessage: '',
            documentId: '',
            viewerConfig: { 
                extensions: ['Autodesk.Fusion360.Animation'] 
            }
        }
    },
    methods: {
        clearModelInViewer () {
            try {
                const thisViewer = viewer.getCurrentViewer()
                if (thisViewer && thisViewer.model) {
                    this.$log.info('... unloading current model from Autodesk Viewer')
                    thisViewer.tearDown()
                    thisViewer.setUp(this.viewerConfig)
                }
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            }
        },
        clearViewer () {
            try {
                if (viewer != null) {
                    let thisViewer = viewer.getCurrentViewer()
                    if (thisViewer) {
                        thisViewer.tearDown()
                        thisViewer.finish()
                        thisViewer = null
                        /**
                         * workaround below is directly manipulating the DOM, 
                         * which could cause re-render issues
                         * better approach is to switch component using :is
                         */
                        // const div = document.querySelector('#forgeViewer')
                        // Array.prototype.slice.call(div.children).forEach(function () { div.removeChild(child) }) 
                    }
                }
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            }
        },
        async getForgeToken () {
            try {
                const res = await this.$axios({
                    method: 'GET',
                    url: new URL('/api/forge/authenticate/viewer', config.koahost).href
                })
                if (res.status === 200) {
                    this.$store.dispatch('setViewerToken', res.data.access_token)
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
                viewer.loadDocument(
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
                const viewer3D = viewer.getCurrentViewer()
                viewer3D.loadModel(path, {}, this.onModelLoaded)
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            }
        },
        onDocumentLoadFailure (viewerErrorCode) {
            this.$log.error(`onDocumentLoadFailure() - errorCode: ${viewerErrorCode}`);
        },
        async onDocumentLoadSuccess (doc) {
            try {
                /* We could still make use of Document.getSubItemsWithProperties()
                   However, when using a ViewingApplication, we have access to the **bubble** attribute,
                   which references the root node of a graph that wraps each object from the Manifest JSON. */
                const viewables = viewer.bubble.search({ 'type': 'geometry' })
                if (viewables.length === 0) {
                    this.$log.error('Document contains no viewables.')
                    return
                }
                // Choose any of the available viewables
                await this.selectItem(doc, viewables)
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            }
        },
        onInitialized () {
            try {
                this.clearViewer()
                viewer = new Autodesk.Viewing.ViewingApplication('forgeViewer')
                viewer.registerViewer(
                    viewer.k3D,
                    Autodesk.Viewing.Private.GuiViewer3D
                )
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
            return
        },
        async selectItem (doc, viewables) {
            try {
                viewer.selectItem(
                    viewables[0].data,
                    this.onItemLoadSuccess,
                    this.onItemLoadFail
                )
                if (viewables.length > 1) {
                    const path = doc.getViewablePath(viewables[0])
                    await this.setAnimations(doc, path)
                }
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            }
        },
        async setAnimations(doc, path) {
            try {
                this.$store.dispatch('setSaving', { animations: true })
                const subFolders = Autodesk.Viewing.Document.getSubItemsWithProperties(
                    doc.getRootItem(), {
                        role: 'animation',
                        type: 'folder'
                    }, 
                    true
                )
                if (subFolders.length < 1) {
                    return
                }
                const children = subFolders[0].children
                const animations = await Promise.all(children.map(async (id, i) => {
                    const subModel = children[i]
                    const imageDataUri = await this.getStoryBoardImageDataUri(doc,subModel)
                    const viewablePath = doc.getViewablePath(subModel)
                    return Promise.resolve({
                        imageDataUri,
                        name: id.name,
                        path: viewablePath
                    })
                }))
                this.$store.dispatch('setAnimations', animations)
            } catch (err) {
                this.alert = true
                this.alertMessage = err
            } finally {
                this.$store.dispatch('setSaving', { animations: false })
                this.$root.$emit('setAnimations', this.$store.state.animations)
            }
        }
    },
    watch: {
        documentId: 'loadDocument'
    }
}
</script>

<style>
#forgeViewer {
  position: relative;
  width: 100%;
  height: 600px;
  margin: 0;
  background-color: #dcdcdc;
}
</style>