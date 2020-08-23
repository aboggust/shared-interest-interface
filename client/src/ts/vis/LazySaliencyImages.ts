import * as d3 from 'd3'
import { D3Sel } from '../etc/Util'
import { HTMLComponent, SVGComponent } from './VComponent'
import { SimpleEventHandler } from '../etc/SimpleEventHandler'
import { SaliencyImg } from '../types';
import { SingleSaliencyImage } from "./SingleSaliencyImage"
import lozad from "lozad"

// type DI = SaliencyImg[]
interface ImgData {
    imgIDs: string[]
    scoreFn: string
}
type DI = ImgData


interface EventsI {
    onScreen: string
}

const Events: EventsI = {
    onScreen: "LazySaliencyImages_ImgOnScreen"
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

        // Create divs for each image
        var saliencyImageCards = self.base
            .selectAll('.saliency-image-card')
            .data(imgData.imgIDs)
            .join('div')
            .classed("saliency-image-card", true)
            .attr("fname-id", d => d)

        saliencyImageCards.each(function (d, i) {
            const observer = lozad(this, {
                load: function(el) {
                    self.trigger(Events.onScreen, {el, id: el.getAttribute("fname-id"), scoreFn})
                }
            }); 
            observer.observe();
        })
    }
}