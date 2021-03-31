import { HTMLComponent } from './VComponent'
import { d3S, D3Sel } from "../etc/Util";
import { SimpleEventHandler } from "../etc/SimpleEventHandler";
import { BestPredicted, SaliencyImg } from "../types"
import * as _ from "lodash"
import * as d3 from "d3"

export interface BestPredictionResultData extends BestPredicted {
    imageCanvas: HTMLCanvasElement
    image: SaliencyImg
    adjacentScoreList?: number[]
    myScoreIdx?: number // Index into adjacentScoreList with this value
}
type DI = BestPredictionResultData

interface EventsI {
    barMouseOver: string
    barMouseOut: string
}

const Events: EventsI = {
    barMouseOver: "BestPredictionResultImage_barMouseOver",
    barMouseOut: "BestPredictionResultImage_barMouesOut",
}

export interface BestPredictionResultImageSels {
    scoreSubtext: D3Sel
    classname: D3Sel
}

export class BestPredictionResultImage extends HTMLComponent<DI> {

    colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([-0.2, 1]) // start the color scheme from light blue instead of white

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
        scoreScaleWidth: d3.scaleLinear().domain([0, 1]).range([0, 100]),
        active_alpha: 120,
        idxInList: -1,
        useAlphaMask: true, // If false, color with traditional saliency color
        showBars: false,
    };
    protected cssName = "best-prediction-result-image";
    imageCanvas: HTMLCanvasElement
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
                    <div class="flex title ID_classname"></div>
                </div>
                <div class="result-image-canvas">
                    <canvas width=${op.width} height=${op.height}></canvas>
                </div>
            </div>
            <div class="score-subtext layout horizontal center" style="width: 100%">
            </div>
        `
        this.base.html(templateHtml)
        this.base.style('width', `${op.width}px`)
        this.sels.scoreSubtext = this.base.select(".score-subtext")

        if (op.showBars) {
            this.sels.scoreSubtext.append("div").attr("class", "score flex-3")
            this.sels.scoreSubtext.append("div").attr("class", "score-bars flex-12 layout vertical start").style('width', "100%")
        } else {
            this.sels.scoreSubtext.append('div').attr("class", "score-info layout horizontal center-center").style('width', '100%')
        }

        this.sels.classname = this.base.select(".ID_classname")
        this.baseCanvas = this.base.select('canvas')
        this.drawCanvas = this._createNewCanvas()
        this.imageCanvas = this._createNewCanvas()
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

        sels.classname.text(data.classname.replace(/_/g," ").toLowerCase())

        const scaleWidth = op.scoreScaleWidth
        const barData = data.adjacentScoreList

        if (op.showBars) {
            const score = this.sels.scoreSubtext.select(".score")
            const scoreBars = this.sels.scoreSubtext.select(".score-bars")
            score.text(data.score.toFixed(2))

            // Enable same behavior on score mouseover as bar mouse over
            score.on("mouseover", () => {
                this.trigger(Events.barMouseOver, { score: data.score.toFixed(2), myScoreIdx: data.myScoreIdx, idxInList: op.idxInList, idx: data.myScoreIdx })
            })
                .on("mouseout", (d, i) => {
                    this.trigger(Events.barMouseOut, { score: data.score.toFixed(2), myScoreIdx: data.myScoreIdx, idxInList: op.idxInList, idx: data.myScoreIdx })
                })

            scoreBars.style("justify-content", "space-between").selectAll(".bar")
                .data(barData)
                .join('div')
                .classed("bar", true)
                .classed("this-img-bar", (d, i) => (i == data.myScoreIdx))
                .on("mouseover", (d, i) => {
                    this.trigger(Events.barMouseOver, { score: d, myScoreIdx: data.myScoreIdx, idxInList: op.idxInList, idx: i })
                })
                .on("mouseout", (d, i) => {
                    this.trigger(Events.barMouseOut, { score: d, myScoreIdx: data.myScoreIdx, idx: i })
                })
                .style("width", d => `${scaleWidth(d)}%`)
                .style("height", `${op.scoreHeight / barData.length}rem`)
                .style("margin-bottom", "1px")
        }
        else {
            const scoreInfo = sels.scoreSubtext.select(".score-info")

            scoreInfo.selectAll(".score-info-box")
                .data([
                    { name: "IoU", value: data.iou },
                    { name: "GTC", value: data.ground_truth_coverage },
                    { name: "SC", value: data.explanation_coverage },
                ])
                .join("div")
                .classed("score-info-box", true)
                .classed("flex", true)
                .classed('info', true)
                .classed("small-title", true)
                .style("margin", "1px 2px")
                .style('color', d => d.value < 0.5 ? '#212529' : '#e3e3e3')
                .style('background-color', d => this.colorScale(d.value))
                .text(d => `${d.name}: ${d.value.toFixed(2)}`)
        }

        // sels.imgScores.append('span')
        //     .classed('info', true)
        //     // .classed('btn', true) // Add when functionality has been added to score info
        //     .text('SC: ' + Number(img.explanation_coverage).toFixed(2))
        //     .style('background-color', self.colorScale(img.explanation_coverage))
        //     .style('color', img.explanation_coverage < 0.5 ? '#212529' : '#e3e3e3')
        //     .on("mouseover", function() {
        //         self.trigger(Events.onScoreHover, {score: img.explanation_coverage})
        //     })
        //     .on("click", function() {
        //         self.trigger(Events.onScoreClick, {score: img.explanation_coverage})
        //     })

        this.baseCanvas
            .property('width', op.width)
            .property('height', op.height);

        // Render BG
        const imgCtx = this.imageCanvas.getContext('2d')
        imgCtx.drawImage(data.imageCanvas, 0, 0, op.width, op.height)
        let imgData = imgCtx.getImageData(0, 0, op.width, op.height)

        // Add mask
        const maskCtx = this.drawCanvas.getContext('2d')
        let maskData = maskCtx.createImageData(op.width, op.height)
        const flatMask = _.flattenDeep(data.saliency_mask)
        const color = op.colors.explanation
        let alpha = Math.floor(op.active_alpha)
        for (let i = 0; i < maskData.data.length; i += 4) {
            const val = flatMask[Math.floor(i / 4)]

            if (op.useAlphaMask) {
                maskData.data[i] = imgData.data[i]
                maskData.data[i + 1] = imgData.data[i + 1]
                maskData.data[i + 2] = imgData.data[i + 2]
                maskData.data[i + 3] = val == 1 ? 255 : alpha
            }
            else {
                maskData.data[i] = color.r
                maskData.data[i + 1] = color.g
                maskData.data[i + 2] = color.b
                maskData.data[i + 3] = 255
            }
        }

        maskCtx.putImageData(maskData, 0, 0)
        const ctx = this.baseCanvas.node().getContext('2d')
        op.useAlphaMask || ctx.drawImage(this.imageCanvas, 0, 0, op.width, op.height)
        ctx.drawImage(this.drawCanvas, 0, 0, op.width, op.height)
    }

    highlight() {
        this.base.classed("highlighted-img", true)
    }

    unHighlight() {
        this.base.classed("highlighted-img", false)
    }
}