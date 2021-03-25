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
    label: D3Sel
    prediction: D3Sel
    score: D3Sel
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
            .on("mouseover", function () {
                self.trigger(Events.onScoreHover, { score: txt.score })
            })
            .on("click", function () {
                self.trigger(Events.onScoreClick, { score: txt.score })
            })

        sels.label.text(txt.label == 1 ? "positive" : "negative")
            .on("mouseover", function () {
                self.trigger(Events.onLabelHover, { label: txt.label })
            })
            .on("click", function () {
                self.trigger(Events.onLabelClick, { label: txt.label })
            })

        sels.prediction.text(txt.prediction == 1 ? "positive" : "negative")
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