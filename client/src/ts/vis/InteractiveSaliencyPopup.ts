import { HTMLComponent } from './VComponent'
import { D3Sel } from "../etc/Util";
import { SimpleEventHandler } from "../etc/SimpleEventHandler";
import { BestPredicted, SaliencyImg } from "../types"
import { scoreFnOptions } from '../etc/selectionOptions'
import { InteractiveSaliencyMask, InteractiveSaliencyMaskSels } from "./InteractiveSaliencyMask"
import { BestPredictionResultData, BestPredictionResultImage } from "./BestPredictionResultImage"
import { State } from "../state"
import { API } from "../api/mainApi"
import * as d3 from "d3"

export type CanvasImageMaskData = {
    image: SaliencyImg
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

interface Options {
    api?: API
    state?: State
    interactiveDrawer: {}
}
export interface InteractiveSaliencyPopupSels {
    scoreFnDropdown: D3Sel
    interactiveSaliency: D3Sel
    resultContainer: D3Sel
    resultMasks: D3Sel
}

export class InteractiveSaliencyPopup extends HTMLComponent<DI> {
    protected options: Options = {
        // Passed to interactive drawer
        interactiveDrawer: {
            width: 224,
            height: 224,
            radius: 8,
            draw_color: "#f2d602",
            active_alpha: .65
        },
    };

    protected cur = {
        scoreFn: scoreFnOptions[0].value,
    }
    protected cssName = "InteractiveSaliencyPopup";
    protected sels: Partial<InteractiveSaliencyPopupSels> = {}

    public static events = Events

    interactiveSaliencyMask: InteractiveSaliencyMask

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
            <div class="layout horizontal center">
                <div class="flex" style="margin-right: 2rem; margin-left: 2rem">
                    <div class="ID_score-dropdown"></div>
                    <div class="ID_interactive-saliency"></div>
                </div>
                <div class="flex-6 layout horizontal result-container wrap" style="position: relative;">
                </div>
            </div>
        </div>
        `
        this.base.html(templateHtml)
        sels.scoreFnDropdown = this.base.select(".ID_score-dropdown").append("select")
            .classed("custom-select", true)
            .classed("custom-select-sm", true)

        sels.scoreFnDropdown.selectAll('option')
            .data(scoreFnOptions)
            .join("option")
            .attr("value", option => option.value)
            .text(option => option.name)
            .data(scoreFnOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name)

        sels.interactiveSaliency = this.base.select(".ID_interactive-saliency").append("div")
        this.interactiveSaliencyMask = new InteractiveSaliencyMask(sels.interactiveSaliency.node(), this.eventHandler)
        sels.resultContainer = this.base.select(".result-container")

        this.eventHandler.bind(InteractiveSaliencyMask.events.submit, () => {
            console.log("Caught event submission!");
            this.base.style("cursor", "progress")

            const maskData = this.interactiveSaliencyMask.drawCanvas.toDataURL().slice(22) // Remove data/png info
            sels.resultContainer.append('div').attr("id", "loading").classed("centered-vh", true)
            const fname = this._data.image.image_id
            op.api.getBestPrediction(fname, maskData, op.state.scoreFn(), topk).then(r => {
                sels.resultContainer.html('')

                this.createResults(r)
                this.base.style("cursor", "default")
            })
            op.api.getSaliencyImage(op.state.caseStudy(), op.state.selectedImage(), op.state.scoreFn()).then(r => {
                console.log("Got my image! ", r)
                this.interactiveSaliencyMask.setNewImage(r.image)
            })
        })
    }

    createResults(resultImgData: BestPredicted[]) {
        const op = this.options,
            sels = this.sels,
            cur = this.cur,
            self = this;

        sels.resultMasks = sels.resultContainer.selectAll('.result-mask-image')
            .data(resultImgData)
            .join('div')
            .classed("result-mask-image", true)
            .classed("flex", true)
            .classed("self-start", true)
            .style("margin", "1rem")

        sels.resultMasks.each(function (d, i) {
            const viz = new BestPredictionResultImage(<HTMLElement>this, self.eventHandler)
            const data = {
                imageCanvas: self.interactiveSaliencyMask.imageCanvas,
                ...d
            }
            viz.update(data)
        })
    }

    _render(data: DI): void {

        const op = this.options,
            sels = this.sels,
            cur = this.cur,
            self = this;

        this.interactiveSaliencyMask.update({image: data.image.image})
        console.log("After update canvas: ", this.interactiveSaliencyMask.imageCanvas)
    }
}