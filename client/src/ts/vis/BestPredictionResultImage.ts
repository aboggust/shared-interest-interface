import { HTMLComponent } from './VComponent'
import { d3S, D3Sel } from "../etc/Util";
import { SimpleEventHandler } from "../etc/SimpleEventHandler";
import { BestPredicted, SaliencyImg } from "../types"
import * as _ from "lodash"
import * as d3 from "d3"

export interface BestPredictionResultData extends BestPredicted {
    imageCanvas: HTMLCanvasElement
    image: SaliencyImg
    adjacentScoreList: number[]
    myScoreIdx: number // Index into adjacentScoreList with this value
}
type DI = BestPredictionResultData

interface EventsI {
}

const Events: EventsI = {
}

export interface BestPredictionResultImageSels {
    score: D3Sel
    scoreSubtext: D3Sel
    scoreBars: D3Sel
    classname: D3Sel
}

export class BestPredictionResultImage extends HTMLComponent<DI> {
    protected options = {
        width: 224,
        height: 224,
        colors: {
            explanation: {
                hex: "#d95f02",
                r: 217,
                g: 95,
                b: 2
            },
            groundTruth: {
                hex: "#f2d602",
                r: 242,
                g: 214,
                b: 2
            }
        },
        scoreHeight: 1.5, // rem
        scoreScaleWidth: d3.scaleLinear().domain([0, 1]).range([0,100]),
        active_alpha: .65
    };
    protected cssName = "best-prediction-result-image";
    // drawCanvas: HTMLCanvasElement
    // imageCanvas: HTMLCanvasElement
    protected baseCanvas: D3Sel;
    protected drawCanvas: HTMLCanvasElement;
    protected sels: Partial<BestPredictionResultImageSels> = {}

    public static events = Events

    constructor(parent: HTMLElement, eventHandler: SimpleEventHandler, options = {}) {
        super(parent, eventHandler);
        this._superInit(options);
        this._init()
    }

    _createNewCanvas() {
        const res = document.createElement('canvas');
        res.width = this.options.width;
        res.height = this.options.height;
        return res;
    }

    protected _init() {
        const op = this.options;
        const templateHtml = `
            <div class="result-image">
                <div class="image-info layout horizontal center">
                    <div class="flex info btn ID_classname"></div>
                </div>
                <div class="result-image-canvas">
                    <canvas width=${op.width} height=${op.height}></canvas>
                </div>
            </div>
            <div class="score-subtext layout horizontal center" style="width: 100%">
                <div class="score flex-3"></div>
                <div class="score-bars flex-12 layout vertical start" style="width: 100%;"></div>
            </div>
        `
        this.base.html(templateHtml)
        this.base.style('width', `${op.width}px`)
        this.sels.score = this.base.select(".score")
        this.sels.scoreSubtext = this.base.select(".score-subtext")
        this.sels.scoreBars = this.base.select(".score-bars")
        this.sels.classname = this.base.select(".ID_classname")
        this.baseCanvas = this.base.select('canvas')
        this.drawCanvas = this._createNewCanvas()
    }

    clearCanvas(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, this.options.width, this.options.height)
    }

    clearCanvases() {
        this.clearCanvas(this.baseCanvas.node())
    }

    _render(data: DI = null): void {
        // #f2d602 bbox
        // #d95f02 explanation

        const op = this.options,
            sels = this.sels;
        sels.score.text(data.score.toFixed(2))
        sels.classname.text(data.classname)

        const scaleWidth = op.scoreScaleWidth
        const barData = data.adjacentScoreList
        sels.scoreBars.style("justify-content", "space-between").selectAll(".bar")
            .data(barData)
            .join('div')
            .classed("bar", true)
            .classed("this-img-bar", (d, i) => (i == data.myScoreIdx))
            .style("width", d => `${scaleWidth(d)}%`)
            .style("height", `${op.scoreHeight / barData.length}rem`)
            .style("margin-bottom", "1px")

        this.baseCanvas
            .property('width', op.width)
            .property('height', op.height);

        const maskCtx = this.drawCanvas.getContext('2d')

        let maskData = maskCtx.createImageData(op.width, op.height)

        const flatMask = _.flattenDeep(data.saliency_mask)

        const color = op.colors.explanation
        let num1 = 0
        let alpha = Math.floor(op.active_alpha * 255)
        for (let i = 0; i < maskData.data.length; i += 4) {
            const val = flatMask[Math.floor(i / 4)]

            if (val == 1) {
                num1 += 1
                maskData.data[i] = color.r
                maskData.data[i + 1] = color.g
                maskData.data[i + 2] = color.b
                maskData.data[i + 3] = alpha
            }
        }

        maskCtx.putImageData(maskData, 0, 0)

        // Render BG
        const ctx = this.baseCanvas.node().getContext('2d')
        ctx.drawImage(data.imageCanvas, 0, 0, op.width, op.height)
        ctx.drawImage(this.drawCanvas, 0, 0, op.width, op.height)
    }
}