import * as d3 from 'd3'
import { D3Sel } from "./etc/Util"
import { LazySaliencyImages } from "./vis/LazySaliencyImages"
import { SingleSaliencyImage } from "./vis/SingleSaliencyImage"
import { ConfusionMatrix } from "./vis/ConfusionMatrix"
import { Histogram } from './vis/Histogram'
import { SimpleEventHandler } from './etc/SimpleEventHandler'
import { API } from './api/mainApi'
import { State, URLParameters } from './state'
import { caseStudyOptions, sortByOptions, predictionFnOptions, scoreFnOptions, labelFilterOptions, caseOptions, caseValues} from './etc/selectionOptions'
import { min } from 'lodash'
import { stat } from 'fs'


/**
 * Render static elements needed for interface
 */
function init(base: D3Sel) {
    const html = `
    <!--  Filter Controls  -->
    <div class="controls container-md cont-nav">
        <div class="form-row">
            <div class="col-sm-3">
                <div class="input-group input-group-sm mb-3">
                    <div class="input-group-prepend">
                        <label class="input-group-text" for="case-study-select">Demo</label>
                    </div>
                    <select class="custom-select custom-select-sm ID_case-study-select">
                        <!-- Fill in from data in TS now -->
                    </select>
                </div>
            </div>

            <div class="col-sm-2">
                <div class="input-group input-group-sm mb-3">
                    <div class="input-group-prepend">
                        <label class="input-group-text" for="scorefn-select">Score</label>
                    </div>
                    <select class="custom-select custom-select-sm ID_scorefn-select">
                        <!-- Fill in from data in TS now -->
                    </select>
                </div>
            </div>

            <div class="col-sm-2">
                <div class="input-group input-group-sm mb-3">
                    <div class="input-group-prepend">
                        <label class="input-group-text" for="sort-by-select">Sort</label>
                    </div>
                    <select class="custom-select custom-select-sm ID_sort-by-select">
                        <!-- Fill in from data in TS now -->
                    </select>
                </div>
            </div>

            <div class="col-sm-2">
                <div class="input-group input-group-sm mb-3">
                    <div class="input-group-prepend">
                        <label class="input-group-text" for="label-filter">Label</label>
                    </div>
                    <select class="custom-select custom-select-sm ID_label-filter">
                        <!-- Fill in from data in TS now -->
                    </select>
                </div>
            </div>

            <div class="col-sm-3">
                <div class="input-group input-group-sm mb-3">
                    <div class="input-group-prepend">
                        <label class="input-group-text" for="prediction-filter">Prediction</label>
                    </div>
                    <select class="custom-select custom-select-sm ID_prediction-filter">
                        <!-- Fill in from data in TS now -->
                    </select>
                </div>
            </div>

        </div>
    </div>

    <!--  Saliency Image Grid  -->
    <div class="ID_main">
        <div class="ID_sidebar">
            <div class="ID_number-of-images">Filtering to x of Y</div>
            <!--  Cases  -->
            <div class="cases">
                <div class="input-group input-group-sm mb-3">
                    <div class="input-group-prepend">
                        <label class="input-group-text" for="case-filter">Case</label>
                    </div>
                    <select class="custom-select custom-select-sm ID_cases">
                        <!-- Fill in from data in TS now -->
                    </select>
                </div>
                <div class="ID_case-description"></div>
            </div>
        </div>
        <div class="ID_mainpage">
            <div class="ID_images-panel"></div>
        </div>

    </div>
    `

    base.html(html)
}

/**
 * Main functionality in the below function
 */
export function main(el: Element, ignoreUrl: boolean = false, stateParams: Partial<URLParameters> = {}, freezeParams: boolean = false, noSidebar: boolean=false) {
    const base = d3.select(el)

    const eventHandler = new SimpleEventHandler(el)
    const api = new API()
    const state = new State(ignoreUrl, stateParams, freezeParams)

    init(base)
    const disableSelection = noSidebar ? 'disabled' : null;
    const selectors = {
        body: d3.select('body'),
        main: base.select('.ID_main').classed("short-height-main", noSidebar),
        navBar: base.select('.controls').classed("remove-margin-top", noSidebar),
        mainPage: base.select('.ID_mainpage').classed("short-height-main", noSidebar),
        imagesPanel: base.select('.ID_images-panel').classed("full-width-images", false),
        sidebar: base.select('.ID_sidebar').classed("empty-sidebar", noSidebar),
        caseStudy: base.select('.ID_case-study-select').attr('disabled', disableSelection),
        caseStudyListOptions: base.select('.ID_case-study-select').selectAll('option')
            .data(caseStudyOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
        scoreFn: base.select('.ID_scorefn-select').attr('disabled', disableSelection),
        scoreFnListOptions: base.select('.ID_scorefn-select').selectAll('option')
            .data(scoreFnOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
        sortBy: base.select('.ID_sort-by-select').attr('disabled', disableSelection),
        sortByListOptions: base.select('.ID_sort-by-select').selectAll('option')
            .data(sortByOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
        predictionFn: base.select('.ID_prediction-filter').attr('disabled', disableSelection),
        predictionFnListOptions: base.select('.ID_prediction-filter').selectAll('option')
            .data(predictionFnOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
        labelFilter: base.select('.ID_label-filter').attr('disabled', disableSelection),
        labelFilterListOptions: base.select('.ID_label-filter').selectAll('option')
            .data(labelFilterOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
        numberOfImages: base.select('.ID_number-of-images'),
        caseFilter: base.select('.ID_cases').attr('disabled', disableSelection),
        caseListOptions: base.select('.ID_cases').selectAll('option')
            .data(caseOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
        caseDescription: base.select('.ID_case-description').classed("description", true)
    }

    const vizs = {
        IouHistogram: noSidebar ? null : new Histogram(<HTMLElement>selectors.sidebar.node(), 'IoU', eventHandler),
        ECHistogram: noSidebar ? null : new Histogram(<HTMLElement>selectors.sidebar.node(), 'Saliency Coverage', eventHandler),
        GTCHistogram: noSidebar ? null : new Histogram(<HTMLElement>selectors.sidebar.node(), 'Ground Truth Coverage', eventHandler),
        saliencyImages: new LazySaliencyImages(<HTMLElement>selectors.imagesPanel.node(), eventHandler),
    }

    const eventHelpers = {
        /**
        * Update the image panel.
        * @param {State} state - the current state of the application.
        */
        updateImages: (state: State) => {
            vizs.saliencyImages.clear()
            const imageIDs = api.getImages(state.caseStudy(), state.sortBy(), state.predictionFn(), state.scoreFn(),
                state.labelFilter(), state.iouFilter(), state.groundTruthFilter(), state.explanationFilter())
            imageIDs.then(IDs => {
                // Set the number of images
                state.imageCount(IDs.length)
                eventHelpers.updateImageCount(state)

                // Update images
                const imgData = {
                    caseStudy: state.caseStudy(),
                    imgIDs: IDs,
                    scoreFn: state.scoreFn()
                }
                vizs.saliencyImages.update(imgData)
            })
        },

        /**
        * Update the image panel, histogram, and confusion matrix.
        * @param {State} state - the current state of the application.
        */
        updatePage: (state: State) => {
            // Update histograms
            const allImageIDs = api.getImages(state.caseStudy(), state.sortBy(), 'all_images', state.scoreFn(),
                '', [0, 1], [0, 1], [0, 1])
            selectors.body.style('cursor', 'progress')
            allImageIDs.then(IDs => {
                // Update number of images
                state.totalImageCount(IDs.length)

                // Update histograms
                api.binScores(state.caseStudy(), IDs, 'iou').then(bins => {
                    noSidebar || vizs.IouHistogram.update({bins: bins, brushRange: state.iouFilter()})
                })
                api.binScores(state.caseStudy(), IDs, 'explanation_coverage').then(bins => {
                    noSidebar || vizs.ECHistogram.update({bins: bins, brushRange: state.explanationFilter()})
                })
                api.binScores(state.caseStudy(), IDs, 'ground_truth_coverage').then(bins => {
                    noSidebar || vizs.GTCHistogram.update({bins: bins, brushRange: state.groundTruthFilter()})
                })
                selectors.body.style('cursor', 'default')
            })

            // Update image panel
            vizs.saliencyImages.clear()
            const imageIDs = api.getImages(state.caseStudy(), state.sortBy(), state.predictionFn(), state.scoreFn(),
                state.labelFilter(), state.iouFilter(), state.groundTruthFilter(), state.explanationFilter())
            selectors.body.style('cursor', 'progress')
            imageIDs.then(IDs => {
                // Set the number of images
                state.imageCount(IDs.length)
                eventHelpers.updateImageCount(state)

                // Set images
                vizs.saliencyImages.update({ caseStudy: state.caseStudy(), imgIDs: IDs, scoreFn: state.scoreFn() })
                selectors.body.style('cursor', 'default')
            })
        },
            
        /**
        * Update the label drop down values.
        * @param {State} state - the current state of the application.
        */
        updateLabels: (state: State) => {
            api.getLabels(state.caseStudy()).then(labels => {
                const labelValues = labels.slice().sort(d3.ascending);
                labels.sort(d3.ascending).splice.apply(labels, [0, 0 as string | number].concat(labelFilterOptions.map(option => option.name)));
                labelValues.splice.apply(labelValues, [0, 0 as string | number].concat(labelFilterOptions.map(option => option.value)));
                selectors.labelFilter.selectAll('option')
                    .data(labels)
                    .join('option')
                    .attr('value', (label, i) => labelValues[i])
                    .attr('disabled', state.isFrozen('labelFilter'))
                    .text(label => label)
                selectors.labelFilter.property('value', state.labelFilter())
            })
        },

        /**
        * Update the prediction drop down values.
        * @param {State} state - the current state of the application.
        */
        updatePredictions: (state: State) => {
            api.getPredictions(state.caseStudy()).then(predictions => {
                const predictionValues = predictions.slice().sort(d3.ascending);
                predictions.sort(d3.ascending).splice.apply(predictions, [0, 0 as string | number].concat(predictionFnOptions.map(option => option.name)));
                predictionValues.splice.apply(predictionValues, [0, 0 as string | number].concat(predictionFnOptions.map(option => option.value)));
                selectors.predictionFn.selectAll('option')
                    .data(predictions)
                    .join('option')
                    .attr('value', (prediction, i) => predictionValues[i])
                    .attr('disabled', state.isFrozen('predictionFn'))
                    .text(prediction => prediction)
                selectors.predictionFn.property('value', state.predictionFn())
            })
        },

        /**
        * Update the case if the filters have changed.
        * @param {State} state - the current state of the application.
        */
        updateCase: (state: State) => {
            const currentCase = selectors.caseFilter.property('value')
            const currentPredictionFilter = selectors.predictionFn.property('value')
            if (currentCase != 'default') { 
                const caseScores = caseValues[currentCase]['scores']
                if ( currentPredictionFilter != caseValues[currentCase]['prediction'] ||
                state.iouFilter()[0] != caseScores['iou'][0] || 
                state.iouFilter()[1] != caseScores['iou'][1] || 
                state.groundTruthFilter()[0] != caseScores['ground_truth_coverage'][0] ||
                state.groundTruthFilter()[1] != caseScores['ground_truth_coverage'][1] ||
                state.explanationFilter()[0] != caseScores['explanation_coverage'][0] ||
                state.explanationFilter()[1] != caseScores['explanation_coverage'][1] ) {
                    selectors.caseFilter.property('value', 'default')
                    selectors.caseDescription.text(caseValues['default']['description'])
                }
            }
        },

        /**
        * Update the image count.
        * @param {State} state - the current state of the application.
        */
        updateImageCount: (state: State) => {
            selectors.numberOfImages.text('Filtering to ' + state.imageCount() + ' of ' + state.totalImageCount() + ' images')
        },

    }

    /**
     * Initialize the application from the state.
     * @param {State} state - the state of the application.
     */
    async function initializeFromState(state: State) {
        // Fill in label and prediction options
        eventHelpers.updateLabels(state)
        eventHelpers.updatePredictions(state)

        // Set frontend via state parameters
        selectors.caseStudy.property('value', state.caseStudy())
        selectors.sortBy.property('value', state.sortBy())
        selectors.scoreFn.property('value', state.scoreFn())

        // Get data from state parameters
        eventHelpers.updatePage(state)
    }

    initializeFromState(state)

    selectors.caseStudy.on('change', () => {
        /* When the case study changes, update the page with the new data. */
        const caseStudy = selectors.caseStudy.property('value')
        state.caseStudy(caseStudy)
        state.labelFilter('')
        eventHelpers.updateLabels(state)
        state.predictionFn('all_images')
        eventHelpers.updatePredictions(state)
        eventHelpers.updatePage(state)
    });

    selectors.sortBy.on('change', () => {
        /* When the sort by value changes, update the image panel. */
        const sortByValue = selectors.sortBy.property('value')
        state.sortBy(sortByValue)
        eventHelpers.updateImages(state)
    });

    selectors.predictionFn.on('change', () => {
        /* When the prediction function changes, update the page. */
        const predictionValue = selectors.predictionFn.property('value')
        state.predictionFn(predictionValue)
        eventHelpers.updateCase(state)
        eventHelpers.updateImages(state)
    });

    selectors.scoreFn.on('change', () => {
        /* When the score function changes, update the page. */
        const scoreValue = selectors.scoreFn.property('value')
        state.scoreFn(scoreValue)
        eventHelpers.updateImages(state)
    });

    selectors.labelFilter.on('change', () => {
        /* When the label filter changes, update the page. */
        const labelFilter = selectors.labelFilter.property('value')
        state.labelFilter(labelFilter)
        eventHelpers.updateImages(state)
    });

    selectors.caseFilter.on('change', () => {
        /* When case changes, update the page. */
        const caseFilter = selectors.caseFilter.property('value')
        if (caseFilter) { 
            const cf = caseValues[caseFilter]
            const caseFilterScores = cf['scores']
            state.scoreFn(cf['selectedScore'])
            state.sortBy(cf['sortBy'])
            selectors.scoreFn.property('value', state.scoreFn())
            selectors.sortBy.property('value', state.sortBy())
            state.iouFilter(caseFilterScores['iou'][0], caseFilterScores['iou'][1])
            state.groundTruthFilter(caseFilterScores['ground_truth_coverage'][0], caseFilterScores['ground_truth_coverage'][1])
            state.explanationFilter(caseFilterScores['explanation_coverage'][0], caseFilterScores['explanation_coverage'][1])
            state.predictionFn(caseValues[caseFilter]['prediction'])
            selectors.caseDescription.text(caseValues[caseFilter]['description'])
            eventHelpers.updatePredictions(state)
            eventHelpers.updatePage(state)
        }
    })

    eventHandler.bind(LazySaliencyImages.events.onScreen, ({ el, id, scoreFn, caseStudy, caller }) => {
        /* Lazy load the saliency images. */
        const img = new SingleSaliencyImage(el, eventHandler)
        api.getSaliencyImage(caseStudy, id, scoreFn).then(salImg => {
            img.update(salImg)
        })
    })

    eventHandler.bind(SingleSaliencyImage.events.onLabelClick, ({ label, caller }) => {
        /* Update label filter on label tag click. */
        if (!state.isFrozen('labelFilter')) {
            selectors.labelFilter.property('value', label)
            state.labelFilter(label)
            eventHelpers.updateImages(state)
        }
    })

    eventHandler.bind(SingleSaliencyImage.events.onPredictionClick, ({ prediction, caller }) => {
        /* Update prediction function on label tag click. */
        if (!state.isFrozen('predictionFn')) {
            selectors.predictionFn.property('value', prediction)
            state.predictionFn(prediction)
            eventHelpers.updateImages(state)
        }
    })

    eventHandler.bind(Histogram.events.onBrush, ({ minScore, maxScore, score, caller }) => {
        /* Filter scores */
        minScore = Math.round((minScore + Number.EPSILON) * 100) / 100
        maxScore = Math.round((maxScore + Number.EPSILON) * 100) / 100
        if (score == 'IoU') { 
            state.iouFilter(minScore, maxScore)
        } else if (score == 'Saliency Coverage') { 
            state.explanationFilter(minScore, maxScore)
        } else if (score == 'Ground Truth Coverage') { 
            state.groundTruthFilter(minScore, maxScore)
        }
        eventHelpers.updateImages(state)

        // Reset case if necessary 
        eventHelpers.updateCase(state)
    })

}