import * as d3 from 'd3'
import { D3Sel } from "./etc/Util"
import { LazySaliencyImages } from "./vis/LazySaliencyImages"
import { SingleSaliencyImage } from "./vis/SingleSaliencyImage"
import { SimpleEventHandler } from './etc/SimpleEventHandler'
import { API } from './api/mainApi'
import { State, URLParameters } from './state'
import { caseStudyOptions, sortByOptions, predictionFnOptions, scoreFnOptions, labelFilterOptions } from './etc/selectionOptions'
import { InteractiveSaliencyMask } from './vis/InteractiveSaliencyMask'
import { BestPredictionResultImage } from "./vis/BestPredictionResultImage"

/**
 * Render static elements needed for interface
 */
function init(base: D3Sel) {
    const html = `
        <div id="main-popup" class="hidden">
            <button class="btn button" id="close-popup">x</button>
            <div id="popup-content"></div>
        </div>
        <div class="layout horizontal center center-center" id="main-wrapper">
            <div id="draw-panel" class="flex-6 self-center layout vertical center-center">
                <div class="title">1. Select scoring method</div>
                <div id="score-select-dropdown" class="btn-light"></div>
                <div class="spacer-5"></div>

                <div class="title">2. Annotate regions of interest</div>
                <div id="interactive-mask"></div>
                <div class="spacer-5"></div>
            </div>
            <div id="divider" class=""></div>
            <div id="results-panel" class="flex-6 self-center"></div>
        </div>
    `
    base.html(html)
}

/**
 * Main functionality in the below function
 */
export function main(el: Element, ignoreUrl: boolean = false, stateParams: Partial<URLParameters> = {}, freezeParams: boolean = false, noSidebar: boolean = false) {
    const base = d3.select(el)
    const eventHandler = new SimpleEventHandler(el)
    const api = new API()
    const state = new State(ignoreUrl, stateParams, freezeParams)

    init(base)
    const sels = {
        html: d3.select('html'),
        body: d3.select('body'),
        mainPopup: d3.select("#main-popup"),
        popupContent: d3.select("#popup-content"),
        closePopup: d3.select("#close-popup"),
        mainWrapper: d3.select("#main-wrapper"),
        drawPanel: d3.select("#draw-panel"),
        scoreSelectDropdown: d3.select("#score-select-dropdown"),
        interactiveMask: d3.select("#interactive-mask"),
        resultsPanel: d3.select("#results-panel")
    }

    const vizs = {
        interactiveSaliencyMask: new InteractiveSaliencyMask(<HTMLElement>sels.interactiveMask.node(), eventHandler),
        lazySaliencyImages: new LazySaliencyImages(<HTMLElement>sels.popupContent.node(), eventHandler),
    }

    const eventHelpers = {
        newPredictions: (state) => {
            if (!vizs.interactiveSaliencyMask.hasContent) {
                sels.resultsPanel.html('')
                return
            }
            const img = state.selectedImage()
            const maskCanvas = vizs.interactiveSaliencyMask.getDrawCanvas(224, 224)
            const maskData = maskCanvas.toDataURL().slice(22)
            sels.resultsPanel.html('').append('div').attr("id", "loading").classed("centered-vh", true)
            const topk = 6
            sels.body.style('cursor', 'progress')
            api.getBestPrediction(state.selectedImage(), maskData, state.scoreFn(), topk).then(r => {
                const resultMasks = sels.resultsPanel.html('').selectAll('.result-mask-image')
                    .data(r)
                    .join('div')
                    .attr('data-index', (d, i) => `${i}`)
                    .classed("result-mask-image", true)
                    .classed("flex", true)
                    .classed("self-start", true)
                    .style("margin", "1rem")

                const scores = r.map(x => +x.score.toFixed(2))
                // const scoreScaleWidth = d3.scaleLinear().domain([d3.min(scores), d3.max(scores)]).range([20,100])
                const scoreScaleWidth = d3.scaleLinear().domain([0, 1]).range([0, 100])

                resultMasks.each(function (d, i) {
                    const viz = new BestPredictionResultImage(<HTMLElement>this, eventHandler, { scoreScaleWidth, idxInList: i })

                    const adjacentScoreList = i == 0 ? scores.slice(0, 3)
                        : i == (scores.length - 1) ? scores.slice(-3)
                            : scores.slice(i - 1, i + 2)

                    const myScoreIdx = i == 0 ? 0
                        : i == (scores.length - 1) ? 2
                            : 1
                    const data = {
                        imageCanvas: vizs.interactiveSaliencyMask.imageCanvas,
                        image: img,
                        adjacentScoreList,
                        myScoreIdx,
                        ...d
                    }
                    viz.update(data)
                })
                sels.body.style("cursor", "default")
            }).catch(e => {
                sels.resultsPanel.html('')
                sels.body.style("cursor", "default")
            })

        },
        updatePage: () => {
            api.getImages(caseStudyOptions[0].value, 1, state.predictionFn(), state.scoreFn(), state.labelFilter()).then(IDs => {
                console.log("IDs: ", IDs)
            })

            // Load mask and initial results
            sels.body.style("cursor", "progress")
            api.getSaliencyImage(state.caseStudy(), state.selectedImage(), state.scoreFn()).then(img => {
                console.log(img)
                vizs.interactiveSaliencyMask.update(img)
                sels.resultsPanel.append('div').attr("id", "loading").classed("centered-vh", true)
                eventHelpers.newPredictions(state)
                sels.body.style("cursor", "default")
            })
        },
        openImageSelection: () => {
            api.getImages(caseStudyOptions[0].value, 1, state.predictionFn(), state.scoreFn(), state.labelFilter()).then(IDs => {
                const data = {
                    caseStudy: state.caseStudy(),
                    imgIDs: IDs,
                    scoreFn: state.scoreFn(),
                    selectedImage: state.selectedImage()
                }
                vizs.lazySaliencyImages.update(data)
                sels.mainPopup.classed('hidden', false)
                sels.mainWrapper.classed('background', true)
            })
        }
    }

    /**
     * Initialize the application from the state.
     * @param {State} state - the state of the application.
     */
    async function initializeFromState(state: State) {
        vizs.interactiveSaliencyMask.radius(state.paintBrushR())

        sels.closePopup.on('click', () => {
            sels.mainPopup.classed("hidden", true)
            sels.mainWrapper.classed("background", false)
        })

        sels.scoreSelectDropdown.append("select")
            .selectAll('option')
            .data(scoreFnOptions)
            .join('option')
            .property('value', d => d.value)
            .text(d => d.name)

        eventHelpers.updatePage()
    }

    initializeFromState(state)

    eventHandler.bind(LazySaliencyImages.events.onScreen, ({ el, id, scoreFn, caseStudy, caller }) => {
        /* Lazy load the saliency images. */
        const img = new SingleSaliencyImage(el, eventHandler, { showStats: false })
        api.getSaliencyImage(caseStudy, id, scoreFn).then(salImg => {
            img.update(salImg)
            salImg.image_id == state.selectedImage() ? img.select() : img.deselect()
        })
    })

    eventHandler.bind(SingleSaliencyImage.events.onImageClick, (img) => {
        d3.selectAll('.saliency-image.selected-image').classed("selected-image", false)
        img.caller.select()
        console.log("IMAGE CLICKED: ", img.image_id);
        console.log(img)
        state.selectedImage(img.image_id)
        vizs.interactiveSaliencyMask.setNewImage(img.image)
    })

    eventHandler.bind(InteractiveSaliencyMask.events.submit, () => {
        eventHelpers.newPredictions(state)
    })

    eventHandler.bind(InteractiveSaliencyMask.events.paintBrushClick, (r) => {
        state.paintBrushR(r.radius)
    })

    eventHandler.bind(InteractiveSaliencyMask.events.selectImage, () => {
        eventHelpers.openImageSelection()
    })

    eventHandler.bind(BestPredictionResultImage.events.barMouseOver, (e) => {
        const idx = e.idxInList + (e.idx - e.myScoreIdx)
        d3.select(`.result-mask-image[data-index="${idx}"]`)
            .classed("highlighted-img", true)
            .classed("selected-highlighted-img", e.idx == e.myScoreIdx)
    })

    eventHandler.bind(BestPredictionResultImage.events.barMouseOut, (e) => {
        d3.selectAll(`.result-mask-image`)
            .classed("highlighted-img", false)
    })
}
