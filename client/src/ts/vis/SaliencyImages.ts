import * as d3 from 'd3'
import { D3Sel } from '../etc/Util'
import { HTMLComponent, SVGComponent } from './VComponent'
import { SimpleEventHandler } from '../etc/SimpleEventHandler'
import { SaliencyImg } from '../types';


type DI = SaliencyImg[]

export class SaliencyImages extends HTMLComponent<DI>{
    cssName = "saliency-images"

    constructor(parent:HTMLElement, eventHandler?:SimpleEventHandler, options={}) {
        super(parent, eventHandler, options)
        this._superInit(options);
        this._init()
    }

    _init() {
    }

    _render(images: SaliencyImg[]) {
        const self = this

        // Create divs for each image
        var saliencyImageCards = self.base
            .selectAll('.saliency-image-card')
            .data(images)
            .join('div')
            .classed('saliency-image-card', true)
            .classed('correct', d => { return d.label == d.prediction })
            .classed('incorrect', d => { return d.label != d.prediction })
            .text(d => '')

        // Add image info to the saliencyImageCards
        var imageInfo = saliencyImageCards
            .append('div')
            .classed('image-info', true)

        imageInfo.append('span')
            .classed('info', true)
            .text(image => 'Score: ' + Number(image.score).toFixed(2))

        imageInfo.append('span')
            .classed('info', true)
            .text(image => 'L: ' + image.label)

        imageInfo.append('span')
            .classed('info', true)
            .text(image => 'P: ' + image.prediction)
            .style('background-color', function(image) {
                if (image.prediction == image.label) { return '#afc4a5' }
                return '#b08989'
            })

        // Add image to the saliencyImageCards
        var imageContainers = saliencyImageCards
            .append('div')
            .classed('image-container', true)

        imageContainers.append('img')
            .classed('saliency-image', true)
            .attr('src', images => "data:image/png;base64, " + images.image)

        // append bbox
        imageContainers.append('svg')
            .classed('bbox', true)
            .classed('mask', true)
            .attr('height', 224)
            .attr('width', 224)
            .append('polygon')
                .attr("points", d => d.bbox)

        // append saliency mask
        imageContainers.append('svg')
            .classed('saliency', true)
            .classed('mask', true)
            .attr('height', 224)
            .attr('width', 224)
            .selectAll('polygon')
                .data(d => d.saliency)
                .join('polygon')
                    .attr("points", d => d)
    }

}