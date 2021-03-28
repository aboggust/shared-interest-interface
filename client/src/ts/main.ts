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
            <div id="draw-panel" class="flex-6 self-center">
                <button class="btn info" id="select-image-button">Select Image</button>
                <div id="score-select-dropdown"></div>
                <div id="interactive-mask"></div>
                <div class="title">Paint Brush Size</div>
                <div id="paint-brush-options"></div>
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
        selectImageButton: d3.select("#select-image-button"),
        scoreSelectDropdown: d3.select("#score-select-dropdown"),
        interactiveMask: d3.select("#interactive-mask"),
        paintBrushOptions: d3.select("#paint-brush-options"),
        resultsPanel: d3.select("#results-panel")
    }

    const vizs = {
        interactiveSaliencyMask: new InteractiveSaliencyMask(<HTMLElement>sels.interactiveMask.node(), eventHandler),
        lazySaliencyImages: new LazySaliencyImages(<HTMLElement>sels.popupContent.node(), eventHandler),
    }

    const eventHelpers = {
        newPredictions: (state) => {
            const img = state.selectedImage()
            const maskCanvas =vizs.interactiveSaliencyMask.getDrawCanvas(224,224) 
            const maskData = maskCanvas.toDataURL().slice(22) // Remove data/png info
            sels.resultsPanel.html('').append('div').attr("id", "loading").classed("centered-vh", true)
            const topk = 6
            api.getBestPrediction(state.selectedImage(), maskData, state.scoreFn(), topk).then(r => {

                const resultMasks = sels.resultsPanel.html('').selectAll('.result-mask-image')
                    .data(r)
                    .join('div')
                    .classed("result-mask-image", true)
                    .classed("flex", true)
                    .classed("self-start", true)
                    .style("margin", "1rem")

                resultMasks.each(function (d, i) {
                    const viz = new BestPredictionResultImage(<HTMLElement>this, eventHandler)
                    const data = {
                        imageCanvas: vizs.interactiveSaliencyMask.imageCanvas,
                        image: img,
                        ...d
                    }
                    viz.update(data)
                })
                sels.body.style("cursor", "default")
            })

        },
        updatePage: () => {
            api.getImages(caseStudyOptions[0].value, 1, state.predictionFn(), state.scoreFn(), state.labelFilter()).then(IDs => {
                console.log("IDs: ", IDs)
            })

            const paintBrushRs = [3, 10, 25]
            const maxR = d3.max(paintBrushRs)

            const paintBrushDivs = sels.paintBrushOptions.attr('class', "layout horizontal center-justified").selectAll('div')
                .data(paintBrushRs)
                .join('div')
                .style('text-align', 'center')
                .on('mouseover', function() {
                    const me = d3.select(this)
                    me.classed("hovered", true)
                })
                .on('mouseout', function() {
                    const me = d3.select(this)
                    me.classed("hovered", false)
                })

            const paintBrushCircles = paintBrushDivs.classed('flex', true).append('svg')
                .classed("self-start", true)
                .attr('width', 2 * maxR)
                .attr('height', 2 * maxR)
                .append('circle')
                .attr('r', d => d)
                .attr('cx', maxR)
                .attr('cy', maxR)

            const selectNewPaintbrush = (r?) => {
                if (r != null) {
                    state.paintBrushR(r)
                    vizs.interactiveSaliencyMask.radius(r)
                }
                paintBrushCircles.classed("selected", d => d == state.paintBrushR())
            }
            selectNewPaintbrush()
            paintBrushDivs.on('click', selectNewPaintbrush)

            // Load mask and initial results
            sels.body.style("cursor", "progress")
            api.getSaliencyImage(state.caseStudy(), state.selectedImage(), state.scoreFn()).then(img => {
                console.log(img)
                vizs.interactiveSaliencyMask.update(img)
                sels.resultsPanel.append('div').attr("id", "loading").classed("centered-vh", true)
                eventHelpers.newPredictions(state)
            })
        }
    }

    /**
     * Initialize the application from the state.
     * @param {State} state - the state of the application.
     */
    async function initializeFromState(state: State) {
        sels.selectImageButton.on('click', () => {
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
        })

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
        const img = new SingleSaliencyImage(el, eventHandler, {showStats: false})
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
}

    // sels.caseStudy.on('change', () => {
    //     /* When the case study changes, update the page with the new data. */
    //     const caseStudy = selectors.caseStudy.property('value')
    //     state.caseStudy(caseStudy)
    //     state.labelFilter('')
    //     eventHelpers.updateLabels(state)
    //     state.predictionFn('all_images')
    //     eventHelpers.updatePredictions(state)
    //     eventHelpers.updatePage(state)
    // });

    // selectors.sortBy.on('change', () => {
    //     /* When the sort by value changes, update the image panel. */
    //     const sortByValue = selectors.sortBy.property('value')
    //     state.sortBy(sortByValue)
    //     eventHelpers.updateImages(state)
    // });

    // selectors.predictionFn.on('change', () => {
    //     /* When the prediction function changes, update the page. */
    //     const predictionValue = selectors.predictionFn.property('value')
    //     state.predictionFn(predictionValue)
    //     eventHelpers.updatePage(state)
    // });

    // selectors.scoreFn.on('change', () => {
    //     /* When the score function changes, update the page. */
    //     const scoreValue = selectors.scoreFn.property('value')
    //     state.scoreFn(scoreValue)
    //     eventHelpers.updatePage(state)
    // });

    // selectors.labelFilter.on('change', () => {
    //     /* When the label filter changes, update the page. */
    //     const labelFilter = selectors.labelFilter.property('value')
    //     state.labelFilter(labelFilter)
    //     eventHelpers.updatePage(state)
    // });

    // eventHandler.bind(LazySaliencyImages.events.onScreen, ({ el, id, scoreFn, caseStudy, caller }) => {
    //     /* Lazy load the saliency images. */
    //     const img = new SingleSaliencyImage(el, eventHandler)
    //     api.getSaliencyImage(caseStudy, id, scoreFn).then(salImg => {
    //         img.update(salImg)
    //     })
    // })

    // eventHandler.bind(SingleSaliencyImage.events.onLabelClick, ({ label, caller }) => {
    //     /* Update label filter on label tag click. */
    //     if (!state.isFrozen('labelFilter')) {
    //         selectors.labelFilter.property('value', label)
    //         state.labelFilter(label)
    //         eventHelpers.updatePage(state)
    //     }
    // })

    // eventHandler.bind(SingleSaliencyImage.events.onPredictionClick, ({ prediction, caller }) => {
    //     /* Update prediction function on label tag click. */
    //     if (!state.isFrozen('predictionFn')) {
    //         selectors.predictionFn.property('value', prediction)
    //         state.predictionFn(prediction)
    //         eventHelpers.updatePage(state)
    //     }
    // })

    // eventHandler.bind(LazySaliencyImages.events.click, ({ fname }) => {
    //     state.selectedImage(fname)
    //     selectors.popup.classed('hidden', false)
    //     // api.getSaliencyImage(state.caseStudy(), state.selectedImage(), state.scoreFn()).then(r => {
    //     //     vizs.interactiveSaliencyMask.setNewImage(r.image)
    //     // })
    // })
    // eventHandler.bind(SingleSaliencyImage.events.onImageClick, (img: SaliencyImg) => {
    //     selectors.popupContent.html('')
    //     eventHelpers.openPopup()
    //     vizs.interactivePopupContent = new InteractiveSaliencyPopup(<HTMLElement>selectors.popupContent.node(), eventHandler, { state, api });
    //     vizs.interactivePopupContent.update({image: img})
    // })
    // eventHandler.bind(LazySaliencyImages.events.mouseOver, ({ fname }) => {
    //     selectors.body.style("cursor", "pointer")
    // })
    // eventHandler.bind(LazySaliencyImages.events.mouseOut, ({ fname }) => {
    //     selectors.body.style("cursor", "default")
    // })


    // const eventHelpers = {
    //     /**
    //     * Update the image panel.
    //     * @param {State} state - the current state of the application.
    //     */
    //     closePopup: () => {
    //         const popup = selectors.popup
    //         popup.classed("hidden", true)
    //         selectors.main.classed("background", false)
    //         selectors.navBar.classed("background", false)
    //     },
    //     openPopup: () => {
    //         const popup = selectors.popup
    //         popup.classed("hidden", false)
    //         selectors.main.classed("background", true)
    //         selectors.navBar.classed("background", true)
    //     },
    //     updateImages: (state: State) => {
    //         vizs.saliencyImages.clear()
    //         const imageIDs = api.getImages(state.caseStudy(), state.sortBy(), state.predictionFn(), state.scoreFn(),
    //             state.labelFilter())
    //         imageIDs.then(IDs => {
    //             const imgData = {
    //                 caseStudy: state.caseStudy(),
    //                 imgIDs: IDs,
    //                 scoreFn: state.scoreFn()
    //             }
    //             vizs.saliencyImages.update(imgData)
    //         })
    //     },

    //     /**
    //     * Update the image panel, histogram, and confusion matrix.
    //     * @param {State} state - the current state of the application.
    //     */
    //     updatePage: (state: State) => {
    //         vizs.saliencyImages.clear()
    //         const imageIDs = api.getImages(state.caseStudy(), state.sortBy(), state.predictionFn(), state.scoreFn(),
    //             state.labelFilter())
    //         selectors.body.style('cursor', 'progress')
    //         imageIDs.then(IDs => {
    //             // Update image panel
    //             vizs.saliencyImages.update({ caseStudy: state.caseStudy(), imgIDs: IDs, scoreFn: state.scoreFn() })

    //             // Update histogram
    //             api.binScores(state.caseStudy(), IDs, state.scoreFn()).then(bins => {
    //                 noSidebar || vizs.histogram.update(bins)
    //             })

    //             // Update confusion matrix
    //             const confusionMatrix = api.getConfusionMatrix(state.caseStudy(), state.labelFilter(), state.scoreFn())
    //             confusionMatrix.then(matrix => {
    //                 noSidebar || vizs.confusionMatrix.update(matrix)
    //             })

    //             // Finished async calls
    //             selectors.body.style('cursor', 'default')

    //         })
    //     },

    //     /**
    //     * Update the label drop down values.
    //     * @param {State} state - the current state of the application.
    //     */
    //     updateLabels: (state: State) => {
    //         api.getLabels(state.caseStudy()).then(labels => {
    //             const labelValues = labels.slice();
    //             labels.splice.apply(labels, [0, 0 as string | number].concat(labelFilterOptions.map(option => option.name)));
    //             labelValues.splice.apply(labelValues, [0, 0 as string | number].concat(labelFilterOptions.map(option => option.value)));
    //             selectors.labelFilter.selectAll('option')
    //                 .data(labels)
    //                 .join('option')
    //                 .attr('value', (label, i) => labelValues[i])
    //                 .attr('disabled', state.isFrozen('labelFilter'))
    //                 .text(label => label)
    //             selectors.labelFilter.property('value', state.labelFilter())
    //         })
    //     },

    //     /**
    //     * Update the prediction drop down values.
    //     * @param {State} state - the current state of the application.
    //     */
    //     updatePredictions: (state: State) => {
    //         api.getPredictions(state.caseStudy()).then(predictions => {
    //             const predictionValues = predictions.slice();
    //             predictions.splice.apply(predictions, [0, 0 as string | number].concat(predictionFnOptions.map(option => option.name)));
    //             predictionValues.splice.apply(predictionValues, [0, 0 as string | number].concat(predictionFnOptions.map(option => option.value)));
    //             selectors.predictionFn.selectAll('option')
    //                 .data(predictions)
    //                 .join('option')
    //                 .attr('value', (prediction, i) => predictionValues[i])
    //                 .attr('disabled', state.isFrozen('predictionFn'))
    //                 .text(prediction => prediction)
    //             selectors.predictionFn.property('value', state.predictionFn())
    //         })
    //     },
    // }
