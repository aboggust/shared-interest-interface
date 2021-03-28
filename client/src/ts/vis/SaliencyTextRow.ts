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
    onScreen: string
}

interface Selections {
    textInfo: D3Sel
    txtRow: D3Sel
    mainTxt: D3Sel
    labels: D3Sel
    scores: D3Sel
}

const Events: EventsI = {
    onScoreClick: "SaliencyTextViz_onScoreClick",
    onScoreHover: "SaliencyTextsViz_onScoreHover",
    onPredictionClick: "SaliencyTextsViz_onPredictionClick",
    onPredictionHover: "SaliencyTextsViz_onPredictionHover",
    onLabelClick: "SaliencyTextsViz_onLabelClick",
    onLabelHover: "SaliencyTextsViz_onLabelHover",
    onScreen: "SaliencyTextsViz_onScreen",
}

export class SaliencyTextViz extends HTMLComponent<DI>{
    cssName = "saliency-text-viz"
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
        const html = `
            <div class="layout horizontal ID_txt-row">
                <div class="txt-info flex"></div>
                <div class="txt-container flex-9"></div>
            </div>
        `
        this.base.html(html)
        // this.base.style('width', '40px')
        const sels = this.sels
        sels.txtRow = this.base.select(".ID_txt-row")
            .style('border', 'lightgray solid 2px')
            .style('border-radius', '4pt')
            .style('padding', '4pt')
        sels.textInfo = this.base.select(".txt-info")
        sels.mainTxt = this.base.select(".txt-container")
            .style('display', 'flex')
            .style('flex-wrap', 'wrap')
            .style('max-height', '125px')
            .style('overflow-y', 'auto')
            .style('align-content', 'flex-start')
        sels.scores = sels.textInfo.append("div").classed('instance-info', true)
        sels.labels = sels.textInfo.append("div").classed('instance-info', true)
        
    }

    _render(txt: SaliencyText) {
        const self = this
        const sels = this.sels
        const op = this.options

        // Handle regression values
        var isCorrect = txt.prediction == txt.label
        if (typeof txt.prediction === 'number') {
            const delta = 0.05;
            isCorrect = txt.prediction >= +txt.label - delta && txt.prediction <= +txt.label + delta;
        }

        // Scores
        sels.scores.append('span').classed('info', true)
            .text('IoU: ' + txt.iou.toFixed(2))
            .style('color', txt.iou < 0.5 ? '#212529' : '#e3e3e3')
            .style('background-color', this.colorScale(txt.iou))
            .on("mouseover", function () {
                self.trigger(Events.onScoreHover, { score: txt.iou })
            })
            .on("click", function () {
                self.trigger(Events.onScoreClick, { score: txt.iou })
            })

        sels.scores.append('span').classed('info', true)
            .text('EC: ' + txt.explanation_coverage.toFixed(2))
            .style('color', txt.explanation_coverage < 0.5 ? '#212529' : '#e3e3e3')
            .style('background-color', this.colorScale(txt.explanation_coverage))
            .on("mouseover", function () {
                self.trigger(Events.onScoreHover, { score: txt.explanation_coverage })
            })
            .on("click", function () {
                self.trigger(Events.onScoreClick, { score: txt.explanation_coverage })
            })

        sels.scores.append('span').classed('info', true)
            .text('GTC: ' + txt.ground_truth_coverage.toFixed(2))
            .style('color', txt.ground_truth_coverage < 0.5 ? '#212529' : '#e3e3e3')
            .style('background-color', this.colorScale(txt.ground_truth_coverage))
            .on("mouseover", function () {
                self.trigger(Events.onScoreHover, { score: txt.ground_truth_coverage })
            })
            .on("click", function () {
                self.trigger(Events.onScoreClick, { score: txt.ground_truth_coverage })
            })

        // Label
        sels.labels.append('span').classed('info', true)
            .text(txt.label)
            .style('background-color', '#d2d3d4')
            .on("mouseover", function () {
                self.trigger(Events.onLabelHover, { label: txt.label })
            })
            .on("click", function () {
                self.trigger(Events.onLabelClick, { label: txt.label })
            })

        // Prediction
        sels.labels.append('span').classed('info', true)
            .text(txt.prediction)
            .style('background-color', isCorrect ? '#afc4a5' : '#b08989')
            .on("mouseover", function () {
                self.trigger(Events.onPredictionHover, { prediction: txt.prediction })
            })
            .on("click", function () {
                self.trigger(Events.onPredictionClick, { prediction: txt.prediction })
            })

        const explanationInds = new Set(txt.explanation_inds)
        const groundTruthInds = new Set(txt.ground_truth_inds)

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
    }
}