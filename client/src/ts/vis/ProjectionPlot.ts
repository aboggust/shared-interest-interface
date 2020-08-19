import * as d3 from 'd3'
import { D3Sel } from '../etc/Util'
import { HTMLComponent, SVGComponent } from './VComponent'
import { SimpleEventHandler } from '../etc/SimpleEventHandler'
import { SaliencyImg } from '../types';
import { UMAP } from 'umap-js';


type DI = SaliencyImg[]

export class ProjectionPlot extends HTMLComponent<DI>{
    cssName = 'projection-plot'

    constructor(parent:HTMLElement, eventHandler?:SimpleEventHandler, options={}) {
        super(parent, eventHandler, options)
        this._superInit(options);
        this._init()
    }

    _init() {
        this.base
            .append('div')
            .classed('title', true)
            .text('Projection Plot')
    }

    _render(images: SaliencyImg[]) {
        const self = this
        d3.selectAll('.projection-plot' + ' svg').remove();

        // Calculate projection and add info to images
        const features = images.map(image => image.features)
        const umap = new UMAP({
            nComponents: 2,
            nNeighbors: 1,
        });
        const embeddings = umap.fit(features);
        for (var _i = 0; _i < embeddings.length; _i++) {
            images[_i].x = embeddings[_i][0]
            images[_i].y = embeddings[_i][1]
        }

        const xDomain = [d3.min(images, d => d.x), d3.max(images, d => d.x)]
        const yDomain = [d3.min(images, d => d.y), d3.max(images, d => d.y)]

        var margin = {top: 10, right: 20, bottom: 30, left: 20},
            width = 200 - margin.left - margin.right,
            height = 200 - margin.top - margin.bottom;

        var svg = self.base
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleLinear()
            .domain(xDomain)
            .range([ 0, width ])

        var y = d3.scaleLinear()
            .domain(yDomain)
            .range([ height, 0]);

        var colorScale = d3.scaleSequential(d3.interpolateYlGnBu);

        svg.append('g')
            .selectAll("dot")
            .data(images)
            .enter()
            .append("circle")
              .attr("cx", function (d) { return x(d.x); } )
              .attr("cy", function (d) { return y(d.y); } )
              .attr("r", 2)
              .attr("fill", d => colorScale(+d.score))
    }

}