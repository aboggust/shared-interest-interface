import * as d3 from 'd3'
import { D3Sel } from '../etc/Util'
import { HTMLComponent } from './VComponent'
import { SimpleEventHandler } from '../etc/SimpleEventHandler'
import { SaliencyText } from '../types';
import { SaliencyTextViz } from "./SaliencyTextRow"
import lozad from "lozad"

type DI = SaliencyText[]

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
    mainTxt: D3Sel
    label: D3Sel
    prediction: D3Sel
    score: D3Sel
}

const Events: EventsI = {
    onScoreClick: "SaliencyTexts_onScoreClick",
    onScoreHover: "SaliencyTexts_onScoreHover",
    onPredictionClick: "SaliencyTexts_onPredictionClick",
    onPredictionHover: "SaliencyTexts_onPredictionHover",
    onLabelClick: "SaliencyTexts_onLabelClick",
    onLabelHover: "SaliencyTexts_onLabelHover",
    onScreen: "SaliencyTexts_onScreen",
}

export class SaliencyTexts extends HTMLComponent<DI>{
    cssName = "saliency-text-container"
    sels: Partial<Selections> = {}
    options = {
        baseLoadHeight: "50px"
    }
    colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([-0.2, 1]) // start the color scheme from light blue instead of white

    static events = Events

    constructor(parent: HTMLElement, eventHandler?: SimpleEventHandler, options = {}) {
        super(parent, eventHandler, options)
        this._superInit(options);
        this._init()
    }

    _init() {
    }

    _render(txts: DI) {
        const self = this
        const sels = this.sels
        const op = this.options

        const saliencyTxtRows = this.base.selectAll('.saliency-txt-row')
            .data(txts)
            .join('div')
            .classed('saliency-txt-row', true)
            .style('margin-bottom', '1rem')
            .style('height', op.baseLoadHeight)
            .attr('fname-id', (d, i) => i)


        saliencyTxtRows.each(function (d, i) {
            const me = d3.select(this)
            const observer = lozad(this, {
                load: function (el) {
                    me.style("height", null)
                    self.trigger(Events.onScreen, { el, id: i })
                }
            });
            observer.observe();
        })
    }
}