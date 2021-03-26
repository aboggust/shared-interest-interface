import { HTMLComponent, SVGComponent } from './VComponent'
import { D3Sel } from "../etc/Util";
import { SimpleEventHandler } from "../etc/SimpleEventHandler";
import * as d3 from "d3"


export type CanvasImageMaskData = {
    image: string
}

interface EventsI {
    resetMask: string
    maskChanged: string
    submit: string
}

const Events: EventsI = {
    resetMask: "InteractiveSaliencyMask_resetMask",
    maskChanged: "InteractiveSaliencyMask_maskChanged",
    submit: "InteractiveSaliencyMask_submit"
}

export interface InteractiveSaliencyMaskSels {
    resetBtn: D3Sel
    submitBtn: D3Sel
}

export class InteractiveSaliencyMask extends HTMLComponent<CanvasImageMaskData> {
    protected options = {
        pos: { x: 0, y: 0 },
        width: 256,
        height: 256,
        radius: 10,
        draw_color: "#f2d602",
        active_alpha: .65
    };
    protected cssName = "InteractiveSaliencyMask";
    drawCanvas: HTMLCanvasElement
    imageCanvas: HTMLCanvasElement
    protected baseCanvas: D3Sel;
    protected sels: Partial<InteractiveSaliencyMaskSels> = {}

    public static events = Events
    protected hasImg: boolean = false

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
            <div class="title">Custom Saliency Overlap</div>
            <span id="reset-button" class="btn">Reset</span>
            <span id="submit-button" class="btn">Submit</span>
            <canvas width=${op.width} height=${op.height}></canvas>
        `
        this.base.html(templateHtml)
        this.sels.resetBtn = this.base.select("#reset-button").on('click', () => {
            this.resetMask()
            this.trigger(Events.resetMask, {})
        })
        this.sels.submitBtn = this.base.select("#submit-button").on('click', () => {
            this.trigger(Events.submit, { mask: this.drawCanvas })
        })
        this.baseCanvas = this.base.select('canvas')
            .property('width', op.width)
            .property('height', op.height)
        this.drawCanvas = this._createNewCanvas()
        this.imageCanvas = this._createNewCanvas()

        const ctx = (<HTMLCanvasElement>this.baseCanvas.node()).getContext('2d');
        const drawCtx = this.drawCanvas.getContext('2d')
        ctx.beginPath();
        ctx.fillText('< please select image from list >', 10, op.height / 2);
        ctx.closePath();

        const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
            ctx.save()
            ctx.globalAlpha = op.active_alpha
            ctx.fillStyle = op.draw_color;
            ctx.beginPath();

            ctx.ellipse(x, y,
                r, r,
                0, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
            ctx.restore()
        }

        const assignMouseMove = () => {
            this.baseCanvas.on("mousemove", (e) => {
                if (!this.hasImg) return
                const [x, y] = d3.mouse(this.baseCanvas.node());
                drawCircle(drawCtx, x, y, op.radius)
                this._render()
            });
        }
        const clearMousemove = () => (this.baseCanvas.on("mousemove", null))

        this.baseCanvas.on("mousedown", assignMouseMove)
        // Assign mouse movement if dragged over with pointer clicked
        this.baseCanvas.on("mouseover", () => {
            const pointerClicked = d3.event.which == 1
            if (pointerClicked) {
                assignMouseMove()
            }
        })

        this.baseCanvas.on("mouseup", clearMousemove)
        this.baseCanvas.on("mouseout", clearMousemove)
    }

    clearCanvas(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, this.options.width, this.options.height)
    }

    clearCanvases() {
        this.clearCanvas(this.baseCanvas.node())
        this.clearCanvas(this.drawCanvas)
        this.clearCanvas(this.imageCanvas)
    }

    resetMask() {
        this.clearCanvas(this.drawCanvas)
        this._render()
    }

    setNewImage(image) {
        if (image == null) {
            this.hasImg = false
            return
        }
        this.hasImg = true
        this.resetMask()
        const imgCtx = this.imageCanvas.getContext('2d');
        const ctx = this.baseCanvas.node().getContext('2d');
        const op = this.options

        const img = new Image()
        img.onload = () => {
            imgCtx.drawImage(img, 0, 0, op.width, op.height)
            ctx.save()
            ctx.globalAlpha = 1
            ctx.drawImage(this.imageCanvas, 0, 0, op.width, op.height)
            ctx.restore()
        }
        img.src = "data:image/png;base64, " + image
        return imgCtx
    }

    _render(rD: CanvasImageMaskData = null): void {

        const op = this.options;

        this.baseCanvas
            .property('width', op.width)
            .property('height', op.height);

        // Render BG
        if (rD?.image != null) {
            this.setNewImage(rD.image)
        }
        const ctx = this.baseCanvas.node().getContext('2d')
        ctx.drawImage(this.imageCanvas, 0, 0, op.width, op.height)
        ctx.globalAlpha = op.active_alpha
        ctx.drawImage(this.drawCanvas, 0, 0, op.width, op.height)
    }
}