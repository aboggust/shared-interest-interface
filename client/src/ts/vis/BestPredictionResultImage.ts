import { HTMLComponent } from './VComponent'
import { D3Sel } from "../etc/Util";
import { SimpleEventHandler } from "../etc/SimpleEventHandler";
import { BestPredicted, SaliencyImg } from "../types"
import * as _ from "lodash"

export interface BestPredictionResultData extends BestPredicted {
    imageCanvas: HTMLCanvasElement
    image: SaliencyImg
}
type DI = BestPredictionResultData

interface EventsI {
}

const Events: EventsI = {
}

export interface BestPredictionResultImageSels {
    score: D3Sel
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
                    <div class="flex info btn ID_score"></div>
                    <div class="flex info btn ID_classname"></div>
                </div>
                <div class="result-image-canvas">
                    <canvas width=${op.width} height=${op.height}></canvas>
                </div>
            </div>
        `
        this.base.html(templateHtml)
        this.sels.score = this.base.select(".ID_score")
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
        sels.score.html('')

        sels.score.selectAll('.score-stat')
            .data([
                { name: "Annotated Score", score: data.score },
            ])
            .join('div')
            .classed(".score-stat", true)
            .text(d => `${d.name}: ${d.score.toFixed(2)}`)

        sels.classname.text(data.classname)

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