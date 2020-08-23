import * as d3 from 'd3'
import { D3Sel } from '../etc/Util'
import { HTMLComponent, SVGComponent } from './VComponent'
import { SimpleEventHandler } from '../etc/SimpleEventHandler'
import { SaliencyImg } from '../types';


type DI = SaliencyImg

interface Selections {
    imgInfo: D3Sel
    imgContainer: D3Sel
    mainImg: D3Sel
    bboxMask: D3Sel
    saliencyMask: D3Sel
}

function toImgStr(img: string) {
    return "data:image/png;base64, " + img
}

export class SingleSaliencyImage extends HTMLComponent<DI>{
    cssName = "saliency-image-card"

    sels: Partial<Selections> = {}
    colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([-0.2, 1]) // start the color scheme from light blue instead of white

    constructor(parent: HTMLElement, eventHandler?: SimpleEventHandler, options = {}) {
        super(parent, eventHandler, options)
        this._superInit(options);
        this._init()
    }


    _init() {
        const self = this
        self.sels.imgInfo = self.base.append("div").classed("image-info", true)
        self.sels.imgContainer = self.base.append("div").classed("image-container", true)

        self.sels.mainImg = self.sels.imgContainer.append("img").classed("saliency-image", true)
        self.sels.bboxMask = self.sels.imgContainer.append("svg").classed("bbox", true).classed("mask", true)
        self.sels.saliencyMask = self.sels.imgContainer.append("svg").classed("saliency", true).classed("mask", true)
    }

    _render(img: SaliencyImg) {
        const self = this
        const sels = this.sels

        const isCorrect = img.prediction == img.label

        // INFO LOGIC
        sels.imgInfo.html('')

        sels.imgInfo.append('span')
            .classed('info', true)
            .text(Number(img.score).toFixed(2))
            .style('background-color', self.colorScale(img.score))
            .style('color', img.score < 0.5 ? '#212529' : '#e3e3e3')

        sels.imgInfo.append('span')
            .classed('info', true)
            .text(img.label)
            .style('background-color', '#d2d3d4')

        sels.imgInfo.append('span')
            .classed('info', true)
            .text(img.prediction)
            .style('background-color', isCorrect ? '#afc4a5' : '#b08989')

        // Container Logic
        sels.imgContainer.classed("correct", isCorrect)
        sels.imgContainer.classed("incorrect", !isCorrect)

        sels.mainImg.attr("src", toImgStr(img.image))
            .attr("height", 175)
            .attr("width", 175)

        sels.bboxMask.html('')
        sels.bboxMask
            .attr("height", 175)
            .attr("width", 175)
            .append("polygon")
            //@ts-ignore
            .attr("points", img.bbox)
                .style('fill-opacity', '10%')
                .style('stroke', '#f2d602')
                .style('stroke-width', '1.5px')

        sels.saliencyMask.html('')
        sels.saliencyMask
            .attr("height", 175)
            .attr("width", 175)
            .selectAll('polygon')
            .data(img.saliency)
            .join('polygon')
                .attr("points", d => d)
                .style('fill-opacity', '10%')
                .style('stroke', '#d95f02')
                .style('stroke-width', '1.5px')

    }

}