import * as d3 from 'd3'
import { D3Sel } from '../etc/Util'
import { HTMLComponent, SVGComponent } from './VComponent'
import { SimpleEventHandler } from '../etc/SimpleEventHandler'
import { BinObject } from '../types';


type DI = BinObject[]

export class Histogram extends HTMLComponent<DI>{
    cssName = 'score-histogram'

    constructor(parent:HTMLElement, eventHandler?:SimpleEventHandler, options={}) {
        super(parent, eventHandler, options)
        this._superInit(options);
        this._init()
    }

    _init() {
        this.base
            .append('div')
            .classed('title', true)
            .text('Score Distribution')
    }

    _render(bins: BinObject[]) {
        const self = this
        // Remove previous histogram
        d3.selectAll('.score-histogram' + ' svg').remove();

        // Compute the histogram data from the images
        const domain: [number, number] = [0, 1]
        var margin = {top: 10, right: 10, bottom: 30, left: 10},
            width = 300 - margin.left - margin.right,
            height = 100 - margin.top - margin.bottom;

        var x = d3.scaleLinear()
            .domain(domain)
            .range([0, width])

        const maxCount = d3.max(bins, b => b.num)
        var y = d3.scaleLinear()
            .domain([0, maxCount])
            .range([height, 0])

        // Visually display the histogram
        var svg = self.base
            .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
            .append('g')
                .attr('transform',
                      'translate(' + margin.left + ',' + margin.top + ')');

        var group = svg.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(x));

        // Build color scale
        var colorScale = d3.scaleSequential()
            .domain([-0.2, 1]) // start the color scheme from light blue instead of white
            .interpolator(d3.interpolateBlues);

        // Fill in bars
        svg.selectAll('rect')
            .data(bins)
            .join('rect')
                .attr('x', 1)
                .attr('transform', d => 'translate(' + x(d.x0) + ',' + y(d.num) + ')')
                .attr('width', d => x(d.x1) - x(d.x0) - 1)
                .attr('height', d => height - y(d.num))
                .attr('fill', d => colorScale(d.x0))
    }

}