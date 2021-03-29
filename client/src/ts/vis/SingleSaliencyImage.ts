import * as d3 from 'd3'
import { D3Sel } from '../etc/Util'
import { HTMLComponent, SVGComponent } from './VComponent'
import { SimpleEventHandler } from '../etc/SimpleEventHandler'
import { SaliencyImg } from '../types';


type DI = SaliencyImg

interface EventsI {
    onScoreClick: string
    onScoreHover: string
    onLabelClick: string
    onLabelHover: string
    onPredictionClick: string
    onPredictionHover: string
}

interface Selections {
    imgInfo: D3Sel
    imgScores: D3Sel
    imgLabels: D3Sel
    imgContainer: D3Sel
    mainImg: D3Sel
    bboxMask: D3Sel
    saliencyMask: D3Sel
}

const Events: EventsI = {
    onScoreClick: "SingleSaliencyImage_onScoreClick",
    onScoreHover: "SingleSaliencyImage_onScoreHover",
    onPredictionClick: "SingleSaliencyImage_onPredictionClick",
    onPredictionHover: "SingleSaliencyImage_onPredictionHover",
    onLabelClick: "SingleSaliencyImage_onLabelClick",
    onLabelHover: "SingleSaliencyImage_onLabelHover",
}

function toImgStr(img: string) {
    return "data:image/png;base64, " + img
}

export class SingleSaliencyImage extends HTMLComponent<DI>{
    cssName = "saliency-image-card"

    sels: Partial<Selections> = {}
    colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([-0.2, 1]) // start the color scheme from light blue instead of white
    
    static events = Events

    constructor(parent: HTMLElement, eventHandler?: SimpleEventHandler, options = {}) {
        super(parent, eventHandler, options)
        this._superInit(options);
        this._init()
    }

    _init() {
        const self = this
        self.sels.imgScores = self.base.append("div").classed("image-info", true)
        self.sels.imgLabels = self.base.append("div").classed("image-info", true)

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
        sels.imgScores.html('')
        sels.imgLabels.html('')

        // IoU Score 
        sels.imgScores.append('span')
            .classed('info', true)
            // .classed('btn', true) // Add when functionality has been added to score info
            .text('IoU: ' + Number(img.iou).toFixed(2))
            .style('background-color', self.colorScale(img.iou))
            .style('color', img.iou < 0.5 ? '#212529' : '#e3e3e3')
            .on("mouseover", function() {
                self.trigger(Events.onScoreHover, {score: img.iou})
            })
            .on("click", function() {
                self.trigger(Events.onScoreClick, {score: img.iou})
            })

        // GTC Score 
        sels.imgScores.append('span')
            .classed('info', true)
            // .classed('btn', true) // Add when functionality has been added to score info
            .text('GTC: ' + Number(img.ground_truth_coverage).toFixed(2))
            .style('background-color', self.colorScale(img.ground_truth_coverage))
            .style('color', img.ground_truth_coverage < 0.5 ? '#212529' : '#e3e3e3')
            .on("mouseover", function() {
                self.trigger(Events.onScoreHover, {score: img.ground_truth_coverage})
            })
            .on("click", function() {
                self.trigger(Events.onScoreClick, {score: img.ground_truth_coverage})
            })

        // EC Score 
        sels.imgScores.append('span')
            .classed('info', true)
            // .classed('btn', true) // Add when functionality has been added to score info
            .text('SC: ' + Number(img.explanation_coverage).toFixed(2))
            .style('background-color', self.colorScale(img.explanation_coverage))
            .style('color', img.explanation_coverage < 0.5 ? '#212529' : '#e3e3e3')
            .on("mouseover", function() {
                self.trigger(Events.onScoreHover, {score: img.explanation_coverage})
            })
            .on("click", function() {
                self.trigger(Events.onScoreClick, {score: img.explanation_coverage})
            })

        // Label 
        sels.imgLabels.append('span')
            .classed('info', true)
            .classed('btn', true)
            .text(img.label)
            .attr('title', img.label)
            .style('background-color', '#d2d3d4')
            .style('text-align', 'center')
            .style('text-overflow', 'ellipsis')
            .style('white-space', 'nowrap')
            .style('overflow', 'hidden')
            .on("mouseover", function() {
                self.trigger(Events.onLabelHover, {label: img.label})
            })
            .on("click", function() {
                self.trigger(Events.onLabelClick, {label: img.label})
            })

        // Prediction
        sels.imgLabels.append('span')
            .classed('info', true)
            .classed('btn', true)
            .text(img.prediction)
            .style('background-color', isCorrect ? '#afc4a5' : '#b08989')
            .attr('title', img.prediction)
            .style('text-align', 'center')
            .style('text-overflow', 'ellipsis')
            .style('white-space', 'nowrap')
            .style('overflow', 'hidden')
            .on("mouseover", function() {
                self.trigger(Events.onPredictionHover, {prediction: img.prediction})
            })
            .on("click", function() {
                self.trigger(Events.onPredictionClick, {prediction: img.prediction})
            })

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