import * as d3 from 'd3'
import { D3Sel } from '../etc/Util'
import { HTMLComponent } from './VComponent'
import { SimpleEventHandler } from '../etc/SimpleEventHandler'
import { SaliencyText } from '../types';

type DI = SaliencyText

interface EventsI {
    onScoreClick: string
    onScoreHover: string
    onLabelClick: string
    onLabelHover: string
    onPredictionClick: string
    onPredictionHover: string
}

interface Selections {
    textInfo: D3Sel
    mainTxt: D3Sel
    label: D3Sel
    prediction: D3Sel
    score: D3Sel

    // bboxMask: D3Sel
    // saliencyMask: D3Sel
}

const Events: EventsI = {
    onScoreClick: "SaliencyTexts_onScoreClick",
    onScoreHover: "SaliencyTexts_onScoreHover",
    onPredictionClick: "SaliencyTexts_onPredictionClick",
    onPredictionHover: "SaliencyTexts_onPredictionHover",
    onLabelClick: "SaliencyTexts_onLabelClick",
    onLabelHover: "SaliencyTexts_onLabelHover",
}

export class SaliencyTextViz extends HTMLComponent<DI>{
    cssName = "saliency-texts"
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
        //     sels.imgInfo.append('span')
        //     .classed('info', true)
        //     // .classed('btn', true) // Add when functionality has been added to score info
        //     .text(Number(img.score).toFixed(2))
        //     .style('background-color', self.colorScale(img.score))
        //     .style('color', img.score < 0.5 ? '#212529' : '#e3e3e3')
        //     .on("mouseover", function() {
        //         self.trigger(Events.onScoreHover, {score: img.score})
        //     })
        //     .on("click", function() {
        //         self.trigger(Events.onScoreClick, {score: img.score})
        //     })

        // sels.imgInfo.append('span')
        //     .classed('info', true)
        //     .classed('btn', true)
        //     .text(img.label)
        //     .attr('title', img.label)
        //     .style('background-color', '#d2d3d4')
        //     .style('text-align', 'center')
        //     .style('text-overflow', 'ellipsis')
        //     .style('white-space', 'nowrap')
        //     .style('overflow', 'hidden')
        //     .on("mouseover", function() {
        //         self.trigger(Events.onLabelHover, {label: img.label})
        //     })
        //     .on("click", function() {
        //         self.trigger(Events.onLabelClick, {label: img.label})
        //     })

        // sels.imgInfo.append('span')
        //     .classed('info', true)
        //     .classed('btn', true)
        //     .text(img.prediction)
        //     .style('background-color', isCorrect ? '#afc4a5' : '#b08989')
        //     .attr('title', img.prediction)
        //     .style('text-align', 'center')
        //     .style('text-overflow', 'ellipsis')
        //     .style('white-space', 'nowrap')
        //     .style('overflow', 'hidden')
        //     .on("mouseover", function() {
        //         self.trigger(Events.onPredictionHover, {prediction: img.prediction})
        //     })
        //     .on("click", function() {
        //         self.trigger(Events.onPredictionClick, {prediction: img.prediction})
        //     })
        const self = this
        const html = `
            <div class="layout horizontal">
                <div class="txt-info flex">
                    <span class="info btn ID_score"></span>
                    <span class="info btn ID_label"></span>
                    <span class="info btn ID_prediction"></span>
                </div>
                <div class="txt-container flex-9"></div>
            </div>
        `
        this.base.html(html)
        // this.base.style('width', '40px')
        const sels = this.sels
        sels.textInfo = this.base.select(".txt-info")
        sels.mainTxt = this.base.select(".txt-container")
            .style('display', 'flex')
            .style('flex-wrap', 'wrap')
            .style('max-height', '125px')
            .style('overflow-y', 'auto')
        sels.prediction = sels.textInfo.select('.ID_prediction')
            .style('text-align', 'center')
            .style('text-overflow', 'ellipsis')
            .style('white-space', 'nowrap')
            .style('overflow', 'hidden')
        sels.label = sels.textInfo.select('.ID_label')
            .style('background-color', '#d2d3d4')
            .style('text-align', 'center')
            .style('text-overflow', 'ellipsis')
            .style('white-space', 'nowrap')
            .style('overflow', 'hidden')
        sels.score = sels.textInfo.select('.ID_score')
    }

    _render(txt: SaliencyText) {
        const self = this
        const sels = this.sels
        const op = this.options
        const isCorrect = txt.prediction == txt.label

        sels.score.text(txt.score.toFixed(2))
            .style('color', txt.score < 0.5 ? '#212529' : '#e3e3e3')
            .style('background-color', this.colorScale(txt.score))
        sels.label.text(txt.label == 1 ? "positive" : "negative")
        sels.prediction.text(txt.prediction == 1 ? "positive" : "negative")
            .style('background-color', isCorrect ? '#afc4a5' : '#b08989')

        const explanationInds = new Set(txt.explanation_inds)
        const groundTruthInds = new Set(txt.ground_truth_inds)

        const white = "#fffffaa"
        sels.mainTxt.selectAll('.word')
            .data(txt.words)
            .join('div')
            .classed('word', true)
            .text(d => d)
            .style('padding-left', '1pt')
            .style('padding-right', '1pt')
            .style('margin-left', '1pt')
            .style('margin-right', '1pt')
            .style('margin-bottom', '2pt')
            .style('background', (d, i) => {
                const isE = explanationInds.has(i), isGT = groundTruthInds.has(i),
                    Ecolor = "#d95f02aa", GTcolor = "#f2d602aa"

                if (isE && isGT) {
                    return `linear-gradient(120deg, ${Ecolor} 50%, ${GTcolor} 50%)`
                }
                if (isE) return Ecolor
                if (isGT) return GTcolor
                return null
            })
        // .style('background-color', (d, i) => {
        //     return explanationInds.has(i) ? "#d95f02aa"
        //         : groundTruthInds.has(i) ? "#f2d602aa"
        //         : ""
        // })

        // // INFO LOGIC
        // sels.imgInfo.html('')

        // sels.imgInfo.append('span')
        //     .classed('info', true)
        //     // .classed('btn', true) // Add when functionality has been added to score info
        //     .text(Number(img.score).toFixed(2))
        //     .style('background-color', self.colorScale(img.score))
        //     .style('color', img.score < 0.5 ? '#212529' : '#e3e3e3')
        //     .on("mouseover", function() {
        //         self.trigger(Events.onScoreHover, {score: img.score})
        //     })
        //     .on("click", function() {
        //         self.trigger(Events.onScoreClick, {score: img.score})
        //     })

        // sels.imgInfo.append('span')
        //     .classed('info', true)
        //     .classed('btn', true)
        //     .text(img.label)
        //     .attr('title', img.label)
        //     .style('background-color', '#d2d3d4')
        //     .style('text-align', 'center')
        //     .style('text-overflow', 'ellipsis')
        //     .style('white-space', 'nowrap')
        //     .style('overflow', 'hidden')
        //     .on("mouseover", function() {
        //         self.trigger(Events.onLabelHover, {label: img.label})
        //     })
        //     .on("click", function() {
        //         self.trigger(Events.onLabelClick, {label: img.label})
        //     })

        // sels.imgInfo.append('span')
        //     .classed('info', true)
        //     .classed('btn', true)
        //     .text(img.prediction)
        //     .style('background-color', isCorrect ? '#afc4a5' : '#b08989')
        //     .attr('title', img.prediction)
        //     .style('text-align', 'center')
        //     .style('text-overflow', 'ellipsis')
        //     .style('white-space', 'nowrap')
        //     .style('overflow', 'hidden')
        //     .on("mouseover", function() {
        //         self.trigger(Events.onPredictionHover, {prediction: img.prediction})
        //     })
        //     .on("click", function() {
        //         self.trigger(Events.onPredictionClick, {prediction: img.prediction})
        //     })

        // // Container Logic
        // sels.imgContainer.classed("correct", isCorrect)
        // sels.imgContainer.classed("incorrect", !isCorrect)

        // sels.mainImg.attr("src", toImgStr(img.image))
        //     .attr("height", 175)
        //     .attr("width", 175)

        // sels.bboxMask.html('')
        // sels.bboxMask
        //     .attr("height", 175)
        //     .attr("width", 175)
        //     .append("polygon")
        //     //@ts-ignore
        //     .attr("points", img.bbox)
        //         .style('fill-opacity', '10%')
        //         .style('stroke', '#f2d602')
        //         .style('stroke-width', '1.5px')

        // sels.saliencyMask.html('')
        // sels.saliencyMask
        //     .attr("height", 175)
        //     .attr("width", 175)
        //     .selectAll('polygon')
        //     .data(img.saliency)
        //     .join('polygon')
        //         .attr("points", d => d)
        //         .style('fill-opacity', '10%')
        //         .style('stroke', '#d95f02')
        //         .style('stroke-width', '1.5px')

    }

}