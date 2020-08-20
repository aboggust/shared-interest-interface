import * as d3 from 'd3'
import { D3Sel } from '../etc/Util'
import { HTMLComponent, SVGComponent } from './VComponent'
import { SimpleEventHandler } from '../etc/SimpleEventHandler'
import { SaliencyImg } from '../types';


type DI = SaliencyImg[]

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

    _render(images: SaliencyImg[]) {
        const self = this
        // Remove previous histogram
        d3.selectAll('.confusion-matrix' + ' svg').remove();

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

        // Compute confusion matrix counts
        var counts = {};
        var labels: Set<string> = new Set();
        for (let image of images) {
            labels.add(image.label)
            labels.add(image.prediction)
            if (counts[image.label] === undefined) {
                counts[image.label] = {};
            };
            if (counts[image.label][image.prediction] === undefined) {
                counts[image.label][image.prediction] = {'count': 1, 'score': parseFloat(image.score)};
            } else {
                counts[image.label][image.prediction].count += 1;
                counts[image.label][image.prediction].score += parseFloat(image.score);
            }
        }

        var labelsList: string[] = Array.from(labels);

        // Convert confusion matrix counts into NxN data object
        var data = [];
        var maxCount = 0;
        for (let label of labelsList) {
            for (let prediction of labelsList) {
                if (counts[label] === undefined || counts[label][prediction] === undefined) {
                    data.push({'label': label, 'prediction': prediction, 'count': 0, 'score': 0})
                } else {
                    data.push({'label': label, 'prediction': prediction,
                               'count': counts[label][prediction].count,
                               'score': counts[label][prediction].score / counts[label][prediction].count});
                    maxCount = d3.max([maxCount, counts[label][prediction].count])
                }
            }
        };

        // Build color scale
        var colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateYlGnBu);

        // Build X scales and axis
        var x = d3.scaleBand()
            .domain(labelsList)
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
            .range([height, 0])
            .domain(labelsList);

        svg.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
                .style('font-size', '6pt');

        // Build the grid
        const xAxisGrid = d3.axisBottom(x).tickSize(-height).tickFormat('');
        const yAxisGrid = d3.axisLeft(y).tickSize(-width).tickFormat('');

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
            .range([0, x.bandwidth()]);

        svg.selectAll()
            .data(data, function(d) {return d.label+':'+d.prediction;})
            .enter()
            .append("rect")
                .attr("x", function(d) {
                    return x(d.label) + (x.bandwidth() - size(d.count))/2;
                })
                .attr("y", function(d) {
                    return y(d.prediction) + (y.bandwidth() - size(d.count))/2;
                })
                .attr("width", function(d) { return size(d.count) })
                .attr("height", function(d) { return size(d.count) })
                .style("fill", function(d) {
                    if (d.score == 0) { return "white";}
                    return colorScale(d.score)
                })
                .style("stroke-width", 4)
                .style("stroke", "none")
                .style("opacity", 0.8)
        })

}