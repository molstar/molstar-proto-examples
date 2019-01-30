/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import './index.html'
import { Canvas3D } from 'mol-star-proto/src/mol-canvas3d/canvas3d';
import CIF from 'mol-star-proto/src/mol-io/reader/cif'
import { Progress } from 'mol-star-proto/src/mol-task'
import { CifFrame } from 'mol-star-proto/src/mol-io/reader/cif'
import { Model, Structure, Format } from 'mol-star-proto/src/mol-model/structure'
import { CartoonRepresentationProvider, CartoonRepresentation } from 'mol-star-proto/src/mol-repr/structure/representation/cartoon';
import { ColorTheme } from 'mol-star-proto/src/mol-theme/color';
import { SizeTheme } from 'mol-star-proto/src/mol-theme/size';

function log(p: Progress) {
    console.log(Progress.format(p))
}

async function parseCif(data: string|Uint8Array) {
    const comp = CIF.parse(data);
    const parsed = await comp.run(log);
    if (parsed.isError) throw parsed;
    return parsed.result;
}

async function downloadCif(url: string, isBinary: boolean) {
    const data = await fetch(url);
    return parseCif(isBinary ? new Uint8Array(await data.arrayBuffer()) : await data.text());
}

async function downloadFromPdb(pdb: string) {
    const parsed = await downloadCif(`https://files.rcsb.org/download/${pdb}.cif`, false);
    return parsed.blocks[0];
}

async function getModels(frame: CifFrame) {
    return await Model.create(Format.mmCIF(frame)).run();
}

async function getStructure(model: Model) {
    return Structure.ofModel(model);
}

const reprCtx = {
    colorThemeRegistry: ColorTheme.createRegistry(),
    sizeThemeRegistry: SizeTheme.createRegistry()
}
function getCartoonRepr() {
    return CartoonRepresentationProvider.factory(reprCtx, CartoonRepresentationProvider.getParams)
}

export class SimpleViewer {
    canvas3d: Canvas3D
    cartoonRepr: CartoonRepresentation

    constructor(elementId: string) {
        const parent = document.getElementById(elementId)!
        parent.style.width = '100%'
        parent.style.height = '100%'

        const canvas = document.createElement('canvas')
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        parent.appendChild(canvas)

        this.canvas3d = Canvas3D.create(canvas, parent)
        this.canvas3d.animate()

        this.cartoonRepr = getCartoonRepr()
        this.canvas3d.add(this.cartoonRepr)
    }

    async loadPdbId(pdbId: string) {
        const cif = await downloadFromPdb(pdbId)
        const models = await getModels(cif)
        const structure = await getStructure(models[0])

        this.cartoonRepr.setTheme({
            color: reprCtx.colorThemeRegistry.create('polymer-index', { structure }),
            size: reprCtx.sizeThemeRegistry.create('uniform', { structure })
        })
        await this.cartoonRepr.createOrUpdate(CartoonRepresentationProvider.defaultValues, structure).run(log)

        this.canvas3d.resetCamera()
    }
}