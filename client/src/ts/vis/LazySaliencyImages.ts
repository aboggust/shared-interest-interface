import * as d3 from 'd3'
import { D3Sel } from '../etc/Util'
import { HTMLComponent, SVGComponent } from './VComponent'
import { SimpleEventHandler } from '../etc/SimpleEventHandler'
import { SaliencyImg } from '../types';
import { SingleSaliencyImage } from "./SingleSaliencyImage"
import lozad from "lozad"

interface ImgData {
    caseStudy: string
    imgIDs: string[]
    scoreFn: string
}
type DI = ImgData


interface EventsI {
    onScreen: string
    click: string
    mouseOver: string
    mouseOut: string
}

const Events: EventsI = {
    onScreen: "LazySaliencyImages_ImgOnScreen",
    click: "LazySaliencyImages_click",
    mouseOver: "LazySaliencyImages_mouseOver",
    mouseOut: "LazySaliencyImages_mouseOut",
}

export class LazySaliencyImages extends HTMLComponent<DI>{
    cssName = "saliency-images"

    static events = Events

    constructor(parent: HTMLElement, eventHandler?: SimpleEventHandler, options = {}) {
        super(parent, eventHandler, options)
        this._superInit(options);
        this._init()
    }

    _init() { }

    _render(imgData: DI) {
        const self = this

        const scoreFn = imgData.scoreFn
        const caseStudy = imgData.caseStudy
        self.base.html('')

        // Create divs for each image
        var saliencyImageCards = self.base
            .selectAll('.saliency-image-card')
            .data(imgData.imgIDs)
            .join('div')
            .classed("saliency-image-card", true)
            .attr("fname-id", d => d)

        saliencyImageCards
            // .on('click', d => {
            //     this.trigger(Events.click, { fname: d })
            // })
            .on('mouseover', function (d) {
                const el = d3.select(this)
                el.classed("hovered", true)
                self.trigger(Events.mouseOver, { fname: d })
            })
            .on('mouseout', function (d) {
                const el = d3.select(this)
                el.classed("hovered", false)
                self.trigger(Events.mouseOut, { fname: d })
            })

        saliencyImageCards.each(function (d, i) {
            const observer = lozad(this, {
                load: function (el) {
                    self.trigger(Events.onScreen, { el, id: el.getAttribute("fname-id"), scoreFn, caseStudy })
                }
            });
            observer.observe();
        })
    }

    clear() {
        this.base.html('')
    }
}