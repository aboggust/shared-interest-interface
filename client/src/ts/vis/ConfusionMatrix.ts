import * as d3 from 'd3'
import { D3Sel } from '../etc/Util'
import { HTMLComponent, SVGComponent } from './VComponent'
import { SimpleEventHandler } from '../etc/SimpleEventHandler'
import { ConfusionMatrixI } from '../types';


type DI = ConfusionMatrixI[]

export class ConfusionMatrix extends HTMLComponent<DI>{
    cssName = 'confusion-matrix'

    constructor(parent:HTMLElement, eventHandler?:SimpleEventHandler, options={}) {
        super(parent, eventHandler, options)
        this._superInit(options);
        this._init()
    }

    _init() {
        this.base
            .append('div')
            .classed('title', true)
            .text('Confusion Matrix')
    }

    _render(confusionMatrix: ConfusionMatrixI[]) {
        const self = this
        // Remove previous histogram
        this.base.selectAll('.confusion-matrix' + ' svg').remove();

        // Compute the histogram data from the images
        const domain: [number, number] = [0, 1]
        var margin = {top: 10, right: 10, bottom: 100, left: 110},
            width = 300 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;

        var svg = self.base
            .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
            .append('g')
                .attr('transform',
                      'translate(' + margin.left + ',' + margin.top + ')');

        const axisLabels = confusionMatrix.reduce((accumulator, item) => {
            accumulator.push(item.label);
            accumulator.push(item.prediction);
            return accumulator
        }, []);
        const uniqueAxisLabels = [...new Set(axisLabels)]
        const maxCount = d3.max(confusionMatrix, item => item.count)

        // Build color scale
        var colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([-0.2, 1]) // start the color scheme from light blue instead of white

        // Build X scales and axis
        var x = d3.scaleBand()
            .domain(uniqueAxisLabels)
            .range([0, width]);

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
                .style('font-size', '6pt')
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

        // Build Y scales and axis
        var y = d3.scaleBand()
            .range([0, height])
            .domain(uniqueAxisLabels);

        svg.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
                .style('font-size', '6pt');

        // Build the grid
        const xAxisGrid = d3.axisBottom(x).tickSize(-height).tickFormat((d, i) => "");
        const yAxisGrid = d3.axisLeft(y).tickSize(-width).tickFormat((d, i) => "");

        svg.append('g')
            .attr('class', 'axis-grid')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxisGrid);

        svg.append('g')
            .attr('class', 'axis-grid')
            .call(yAxisGrid);

        // Create a size scale for square height and width
        var size = d3.scaleSqrt()
            .domain([0, maxCount])
            .range([2, x.bandwidth() - 1]);

        svg.selectAll()
            .data(confusionMatrix, (d:ConfusionMatrixI) => d.prediction+':'+d.label)
            .enter()
            .append("rect")
                .attr("x", d => x(d.prediction) + (x.bandwidth() - size(d.count))/2)
                .attr("y", d => y(d.label) + (y.bandwidth() - size(d.count))/2)
                .attr("width", d => {
                    if (d.count == 0) { return 0 }
                    return size(d.count)
                })
                .attr("height", d => {
                    if (d.count == 0) { return 0 }
                    return size(d.count)
                })
                .style("fill", d => colorScale(d.mean))
                .style("stroke-width", 1)
                .style("stroke", "none")
        }

}