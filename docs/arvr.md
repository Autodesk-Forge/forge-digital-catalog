# AR/VR Operation, Maintenance and Training

Most manufacturing companies use various industrial equipments and machines to manufacture their products. There is always a need to look for revenue growth opportunities and improving efficiency and cost to service industrial machines is one way to meet this goal.

Nowadays, with the technological advances in augmented reality, manufacturers can create instructions for operating, servicing, repairing their machines and those instructions can be played as animations in an AR/VR device. Machine expertise can be shared intuitively in an augmented reality scene and each machine operator can access work instructions from anywhere, as well as getting the expert guidance they need in a rich AR environment.

This digital catalog app has a built-in feature to enable AR workflows by adding translation support for most CAD file formats to the [glTF](https://www.khronos.org/gltf/) (GL Transmission Format) file format. glTF format is an effective way to streamline authoring workflows and enable interoperable use of 3D content across the industry. Most AR/VR solutions can import glTF files.

## Table of Contents

* [Translating CAD models to glTF file format](#translate-svf-to-gltf)
* [Validating the glTF output](#validating-the-gltf-output)
* [Choosing an Augmented Reality Authoring Tool](#choosing-an-ar-tool)

## Translate SVF to glTF

The digital catalog app publisher console can be configured to become the translation pipeline of CAD models to SVF and glTF formats.

To enable this translation feature, simply login to the Administrative console and turn on the feature toggle *AR/VR Toolkit*.

![ARVR Toolkit](/_media/arvr_toolkit.png)

You can fine tune the translation output by using any combination of the following commands:

* `Binary Output` to output glb file instead of gltf
* `Deduplication` to try and remove duplicate geometries
* `Draco Compression` to compress meshes using Draco library
* `Skip unused UVs` to skip texture UVs that are not used by any material

To generate glTF files, simply publish a CAD model to the catalog and once the translation completes, the admin user can download the glTF output via a right-click on the catalog item displayed in the publisher console.

![download glTF](/_media/download_gltf.png)

Inside the compressed archive, you will find a new file `metadata.json` which captures the CAD units. This information may come in handy when importing the glTF into Unity or other augmented reality tool.

The glTF files can be emailed to the person who will author the animations.

## Validating the glTF output

The glTF files can be tested with a simple drag and drop into this free [glTF viewer](https://gltf-viewer.donmccurdy.com/).

## Choosing an AR tool

The list below is not an exhaustive list of AR/VR tools you can choose to author instructions in a rich AR/VR environment. This list is just provided as-is and does not represent an official recommendation from Autodesk.

### Apple AR Kit

[Authoring Instructions with Apple ARKit](arvr/apple-arkit)

### Scope AR

[Authoring Instructions with Scope AR](arvr/scopear)
