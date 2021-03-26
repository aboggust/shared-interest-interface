import * as d3 from 'd3'
import { D3Sel } from '../etc/Util'
import { HTMLComponent, SVGComponent } from './VComponent'
import { SimpleEventHandler } from '../etc/SimpleEventHandler'
import { Bins } from '../types';


interface HistogramI { 
    bins: Bins[]
    brushRange: number[]
}

type DI = HistogramI

interface EventsI {
    onBrush: string
}

const Events: EventsI = {
    onBrush: "Histogram_onBrush"
}

export class Histogram extends HTMLComponent<DI>{
    cssName = 'score-histogram'
    static events = Events
    score: string;

    constructor(parent:HTMLElement, score:string, eventHandler?:SimpleEventHandler, options={},) {
        super(parent, eventHandler, options)
        this._superInit(options);
        this._init(score)
    }

    _init(score?:string) {
        this.score = score
        this.base
            .append('div')
            .classed('title', true)
            .text(this.score + ' Distribution')
    }

    _render(histogram: HistogramI) {
        const self = this
        const bins = histogram.bins
        const brushRange = histogram.brushRange

        // Remove previous histogram
        this.base.selectAll('.score-histogram' + ' svg').remove();

        // Compute the histogram data from the images
        const domain: [number, number] = [0, 1]
        const totalWidth = 300
        const totalHeight = 100
        var margin = {top: 10, right: 10, bottom: 30, left: 10},
            width = totalWidth - margin.left - margin.right,
            height = totalHeight - margin.top - margin.bottom;

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
        var colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([-0.2, 1]) // start the color scheme from light blue instead of white

        // Fill in bars
        svg.selectAll('rect')
            .data(bins)
            .join('rect')
                .attr('x', 1)
                .attr('transform', d => 'translate(' + x(d.x0) + ',' + y(d.num) + ')')
                .attr('width', d => x(d.x1) - x(d.x0) - 1)
                .attr('height', d => height - y(d.num))
                .attr('fill', d => colorScale(d.x0))

        // Add brush
        const brushStartX = 10;
        const brushEndX = 290;
        const brushWidth = brushEndX - brushStartX;
        const brushStartY = 0; 
        const brushEndY = totalHeight - 10;
        const brush = d3.brushX()                     // Add the brush feature using the d3.brush function
            .extent( [ [brushStartX, brushStartY], [brushEndX, brushEndY] ] )       // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", function(){
                var left = brushStartX;
                var right = brushEndX;
                if (d3.event.selection) {
                    left = d3.event.selection[0]
                    right = d3.event.selection[1]
                }
                const minScore = (left - brushStartX) / brushWidth
                const maxScore = (right - brushStartX) / brushWidth
                self.trigger(Events.onBrush, {minScore: minScore, maxScore: maxScore, score: self.score})
            })

        self.base.selectAll('.score-histogram' + ' svg').call(brush)

        if (brushRange[0] != 0 && brushRange[1] != 1) {
            const left = brushRange[0] + (brushStartX / brushWidth);
            const right = brushRange[1] + (brushStartX / brushWidth);
            self.base.selectAll('.score-histogram' + ' svg').call(brush.move, [left, right].map(x))

        }
    }

}