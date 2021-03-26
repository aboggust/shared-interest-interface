import { HTMLComponent } from './VComponent'
import { D3Sel } from "../etc/Util";
import { SimpleEventHandler } from "../etc/SimpleEventHandler";
import { BestPredicted } from "../types"
import { scoreFnOptions } from '../etc/selectionOptions'
import { InteractiveSaliencyMask } from "./InteractiveSaliencyMask"
import * as d3 from "d3"

export type CanvasImageMaskData = {
    image: HTMLCanvasElement
    mask: HTMLCanvasElement
    scoreFn: string
    bestPredicted?: BestPredicted[]
}
type DI = CanvasImageMaskData

interface EventsI {
    resetMask: string
    maskChanged: string
    submit: string
    scoreFnChanged: string
}

const Events: EventsI = {
    resetMask: "InteractiveSaliencyPopup_resetMask",
    maskChanged: "InteractiveSaliencyPopup_maskChanged",
    submit: "InteractiveSaliencyPopup_submit",
    scoreFnChanged: "InteractiveSaliencyPopup_scoreFnChanged"
}

export interface InteractiveSaliencyPopupSels {
    scoreFnDropdown: D3Sel
    interactiveSaliency: D3Sel
    resultContainer: D3Sel
    resultMasks: D3Sel
}

export class InteractiveSaliencyPopup extends HTMLComponent<DI> {
    protected options = {
        // Passed to interactive drawer
        interactiveDrawer: {
            width: 224, 
            height: 224,
            radius: 8,
            draw_color: "#f2d602",
            active_alpha: .65
        }
    };

    protected cur = {
        scoreFn: scoreFnOptions[0].value
    }
    protected cssName = "InteractiveSaliencyPopup";
    protected sels: Partial<InteractiveSaliencyPopupSels> = {}

    public static events = Events

    constructor(parent: HTMLElement, eventHandler: SimpleEventHandler, options = {}) {
        super(parent, eventHandler);
        this._superInit(options);
        this._init()
    }

    protected _init() {
        const op = this.options,
            sels = this.sels;
        const templateHtml = `
            <div class="result-popup">
                <div class="layout horizontal">
                    <div class="flex-4">
                        <div class="ID_score-dropdown"></div>
                        <div class="ID_interactive-saliency></div>
                    </div>
                    <div class="flex layout horizontal result-container">
                        <div class="flex result-mask"></div>
                    </div>
                </div>
            </div>
        `
        this.base.html(templateHtml)
        sels.scoreFnDropdown = this.base.select(".ID_score-dropdown").append("select")
            .classed("custom-select", true)
            .classed("custom-select-sm", true)

        sels.scoreFnDropdown
            .data(scoreFnOptions)
            .join("option")
            .attr("value", option => option.value)
            .text(option => option.name)
            .data(scoreFnOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),

        sels.interactiveSaliency = this.base.select(".ID_interactive-saliency")
        sels.resultContainer = this.base.select(".result-container")
    }

    _render(rD: DI): void {

        const op = this.options,
            sels = this.sels,
            cur = this.cur;

        cur.scoreFn = rD.scoreFn

        const interactiveSaliencyData = {
            image: rD.image,
            drawing: rD.mask
        }

        const newInteractiveViz = new InteractiveSaliencyMask(<HTMLElement>sels.interactiveSaliency.node(), this.eventHandler, op.interactiveDrawer)
        newInteractiveViz.update(interactiveSaliencyData)

    }
}