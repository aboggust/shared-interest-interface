import * as d3 from 'd3'
import { D3Sel } from '../etc/Util'
import { HTMLComponent, SVGComponent } from './VComponent'
import { SimpleEventHandler } from '../etc/SimpleEventHandler'
import { SingleSaliencyImage } from "./SingleSaliencyImage"
import { API } from '../api/mainApi'
import lozad from "lozad"

interface ImgDatum {
    caseStudy: string
    fname: string
    scoreFn: string
}

interface Selections {
    row1: D3Sel
    row2: D3Sel
    row3: D3Sel

    row1data: D3Sel
    row2data: D3Sel
    row3data: D3Sel
}

interface EventsI { }

const Events: EventsI = {}

export class ResultTable extends HTMLComponent<null>{
    cssName = "result-table"

    static events = Events

    sels: Partial<Selections> = {}

    api = new API()

    constructor(parent: HTMLElement, eventHandler?: SimpleEventHandler, options = {}) {
        super(parent, eventHandler, options)
        this._superInit(options);
        this._init()
    }

    _init() {

        const intoRowInfo = (fnames: string[], sets: string[], scoreFn: string) => {
            return d3.zip(fnames, sets).map(v => {
                console.log("FORMING: ", v);
                return {
                    fname: v[0],
                    caseStudy: v[1],
                    scoreFn
                }
            })

        }
        const row1fnames = ["n04252077_5244", "n02093754_4378", "n02085936_4713", "n02100735_9861"]
        const row1set = ["data_vehicle", "data_dogs", "data_dogs", "data_dogs"]

        const row1info = intoRowInfo(row1fnames, row1set, "saliency_proportion_score")

        const row2fnames = ["n03272562_4288", "n03770679_13012", "n02930766_35425", "n02085620_3360"]
        const row2set = ["data_vehicle", "data_vehicle", "data_vehicle", "data_dogs"]
        const row2info = intoRowInfo(row2fnames, row2set, "bbox_proportion_score")

        const row3fnames = ["n03538406_1959", "n02111889_6826", "n04467665_70844", "n03785016_25768"]
        const row3set = ["data_vehicle", "data_dogs", "data_vehicle", "data_vehicle"]
        const row3info = intoRowInfo(row3fnames, row3set, "iou_score")

        const self = this;
        const html = `
        <table class="table table-sm table-borderless">
  <thead>
    <tr>
      <th scope="col"></th>
      <th scope="col" colspan="2" class="text-center">Low Score</th>
      <th scope="col" colspan="2" class="text-center">High Score</th>
    </tr>
    <tr>
      <th scope="col"></th>
      <th scope="col" class="text-center">Correct</th>
      <th scope="col" class="text-center">Incorrect</th>
      <th scope="col" class="text-center">Correct</th>
      <th scope="col" class="text-center">Incorrect</th>
    </tr>
  </thead>
  <tbody>
    <tr id="row1">
      <th scope="row" class="align-middle">Explanation Coverage</th>
    </tr>
    <tr id="row2">
      <th scope="row" class="align-middle">Ground Truth Coverage</th>
    </tr>
    <tr id="row3">
      <th scope="row" class="align-middle">IoU</th>
    </tr>
  </tbody>
</table>
        `
        self.base.html(html)

        this.sels.row1 = self.base.select("#row1")
        this.sels.row2 = self.base.select("#row2")
        this.sels.row3 = self.base.select("#row3")

        this.sels.row1data = this.sels.row1.selectAll(".img-card")
            .data(row1info)
            .join("td")
            .classed("img-card", true)
            .attr("fname", d => d.fname)
            .attr("case-study", d => d.caseStudy)
            .attr("score", d => d.scoreFn)

        this.sels.row2data = this.sels.row2.selectAll(".img-card")
            .data(row2info)
            .join("td")
            .classed("img-card", true)
            .attr("fname", d => d.fname)
            .attr("case-study", d => d.caseStudy)
            .attr("score", d => d.scoreFn)

        this.sels.row3data = this.sels.row3.selectAll(".img-card")
            .data(row3info)
            .join("td")
            .classed("img-card", true)
            .attr("fname", d => d.fname)
            .attr("case-study", d => d.caseStudy)
            .attr("score", d => d.scoreFn)
    }

    _render(x: null) { 
        const self = this
        function initLozad(d: ImgDatum, i: number) {
            const observer = lozad(this, {
                load: function(el: HTMLElement) {
                    // Perform api manipulation here. 
                    const me = d3.select(el)
                    const fname = me.attr('fname')
                    const caseStudy = me.attr('case-study')
                    const scoreFn = me.attr('score')
                    const imgDiv = me.append("div")

                    console.log("THING REQUESTTED: ", `${caseStudy} - ${fname} - ${scoreFn}`);
                    const img = new SingleSaliencyImage(imgDiv.node(), self.eventHandler)
                    self.api.getSaliencyImage(caseStudy, fname, scoreFn).then(r => {
                        console.log("THING RENDERED: ", `${caseStudy} - ${fname} - ${scoreFn}`);
                        img.update(r)
                    })
                }
            }); 
            observer.observe();
        }

        self.sels.row1data.each(initLozad)
        self.sels.row2data.each(initLozad)
        self.sels.row3data.each(initLozad)
    }
}