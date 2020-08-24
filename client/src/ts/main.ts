import * as d3 from 'd3'
import { LazySaliencyImages } from "./vis/LazySaliencyImages"
import { SingleSaliencyImage } from "./vis/SingleSaliencyImage"
import { ConfusionMatrix } from "./vis/ConfusionMatrix"
import { Histogram } from './vis/Histogram'
import { SimpleEventHandler } from './etc/SimpleEventHandler'
import { API } from './api/mainApi'
import { State } from './state'
import { caseStudyOptions, sortByOptions, predictionFnOptions, scoreFnOptions, labelFilterOptions } from './etc/selectionOptions'
import { SaliencyImg } from './types';

/**
 * Main functionality in the below function
 */
export function main() {
    const eventHandler = new SimpleEventHandler(<Element>d3.select('body').node())
    const api = new API()
    const state = new State()

    const selectors = {
        window: d3.select(window),
        body: d3.select('body'),
        main: d3.select('#mainpage'),
        imagesPanel: d3.select('#images-panel'),
        sidebar: d3.select('#sidebar'),
        caseStudy: d3.select('#case-study-select'),
        caseStudyListOptions: d3.select('#case-study-select').selectAll('option')
            .data(caseStudyOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
        scoreFn: d3.select('#scorefn-select'),
        scoreFnListOptions: d3.select('#scorefn-select').selectAll('option')
            .data(scoreFnOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
        sortBy: d3.select('#sort-by-select'),
        sortByListOptions: d3.select('#sort-by-select').selectAll('option')
            .data(sortByOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
        predictionFn: d3.select('#prediction-filter'),
        predictionFnListOptions: d3.select('#prediction-filter').selectAll('option')
            .data(predictionFnOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
        labelFilter: d3.select('#label-filter'),
        labelFilterListOptions: d3.select('#label-filter').selectAll('option')
            .data(labelFilterOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
    }

    const vizs = {
        histogram: new Histogram(<HTMLElement>selectors.sidebar.node(), eventHandler),
        confusionMatrix: new ConfusionMatrix(<HTMLElement>selectors.sidebar.node(), eventHandler),
        saliencyImages: new LazySaliencyImages(<HTMLElement>selectors.imagesPanel.node(), eventHandler),
    }

    const eventHelpers = {
        updateImages: (state: State) => {
            vizs.saliencyImages.clear()
            const imageIDs = api.getImages(state.caseStudy(), state.sortBy(), state.predictionFn(), state.scoreFn(),
                                           state.labelFilter())
            imageIDs.then(IDs => {
                state.numImages(IDs.length)
                const imgData = {
                    caseStudy: state.caseStudy(),
                    imgIDs: IDs,
                    scoreFn: state.scoreFn()
                }
                vizs.saliencyImages.update(imgData)
            })
        },

        updatePage: (state: State) => {
            vizs.saliencyImages.clear()
            const imageIDs = api.getImages(state.caseStudy(), state.sortBy(), state.predictionFn(), state.scoreFn(),
                                           state.labelFilter())
            selectors.body.style('cursor', 'progress')
            imageIDs.then(IDs => {
                state.numImages(IDs.length)
                vizs.saliencyImages.update({ caseStudy: state.caseStudy(), imgIDs: IDs, scoreFn: state.scoreFn() })

                // Update histogram
                api.binScores(state.caseStudy(), IDs, state.scoreFn()).then(bins => {
                    vizs.histogram.update(bins)
                })

                // Update confusion matrix
                const confusionMatrix = api.getConfusionMatrix(state.caseStudy(), state.labelFilter(), state.scoreFn())
                confusionMatrix.then(matrix => {
                    vizs.confusionMatrix.update(matrix)
                })

                // Finished async calls
                selectors.body.style('cursor', 'default')

            })
        },

    }

    /**
     * Initialize the application from the state
     *
     * @param state the state of the application
     */
    async function initializeFromState(state: State) {
        // Fill in label options
        const labelsPromise = api.getLabels(state.caseStudy());
        labelsPromise.then(labels => {
            const labelValues = labels.slice();
            labels.splice.apply(labels, [0, 0 as string | number].concat(labelFilterOptions.map(option => option.name)));
            labelValues.splice.apply(labelValues, [0, 0 as string | number].concat(labelFilterOptions.map(option => option.value)));
            selectors.labelFilter.selectAll('option')
                .data(labels)
                .join('option')
                .attr('value', (label, i) => labelValues[i])
                .text(label => label)
            selectors.labelFilter.property('value', state.labelFilter())
        })

        // Fill in prediction options
        const predictionsPromise = api.getPredictions(state.caseStudy();
        predictionsPromise.then(predictions => {
            const predictionValues = predictions.slice();
            predictions.splice.apply(predictions, [0, 0 as string | number].concat(predictionFnOptions.map(option => option.name)));
            predictionValues.splice.apply(predictionValues, [0, 0 as string | number].concat(predictionFnOptions.map(option => option.value)));
            selectors.predictionFn.selectAll('option')
                .data(predictions)
                .join('option')
                .attr('value', (prediction, i) => predictionValues[i])
                .text(prediction => prediction)
            selectors.predictionFn.property('value', state.predictionFn())
        })

        // Set frontend via state parameters
        selectors.caseStudy.property('value', state.caseStudy())
        selectors.sortBy.property('value', state.sortBy())
        selectors.scoreFn.property('value', state.scoreFn())

        // Get data from state parameters
        eventHelpers.updatePage(state)
    }

    initializeFromState(state)

    /**
     * Binding the event handler
    */
    selectors.caseStudy.on('change', () => {
        const caseStudy = selectors.caseStudy.property('value')
        state.caseStudy(caseStudy)
        eventHelpers.updatePage(state)
    });

    selectors.sortBy.on('change', () => {
        const sortByValue = selectors.sortBy.property('value')
        state.sortBy(sortByValue)
        eventHelpers.updateImages(state)
    });

    selectors.predictionFn.on('change', () => {
        const predictionValue = selectors.predictionFn.property('value')
        state.predictionFn(predictionValue)
        eventHelpers.updatePage(state)
    });

    selectors.scoreFn.on('change', () => {
        const scoreValue = selectors.scoreFn.property('value')
        state.scoreFn(scoreValue)
        eventHelpers.updatePage(state)
    });

    selectors.labelFilter.on('change', () => {
        const labelFilter = selectors.labelFilter.property('value')
        state.labelFilter(labelFilter)
        eventHelpers.updatePage(state)
    });

    eventHandler.bind(LazySaliencyImages.events.onScreen, ({ el, id, scoreFn, caseStudy, caller }) => {
        const img = new SingleSaliencyImage(el, eventHandler)
        api.getSaliencyImage(caseStudy, id, scoreFn).then(salImg => {
            img.update(salImg)
        })
    })

    eventHandler.bind(SingleSaliencyImage.events.onScoreHover, ({score, caller}) => {
        // Put Logic for showing on histogram here
    })

    eventHandler.bind(SingleSaliencyImage.events.onPredictionHover, ({prediction, caller}) => {
        // Put logic for highlighting row on confusion matrix if exists (low prio)
    })

    eventHandler.bind(SingleSaliencyImage.events.onLabelHover, ({label, caller}) => {
        // Put logic for highlighting col on confusion matrix if exists (low prio)
    })

    eventHandler.bind(SingleSaliencyImage.events.onLabelClick, ({label, caller}) => {
        selectors.labelFilter.property('value', label)
        state.labelFilter(label)
        eventHelpers.updatePage(state)
    })

    eventHandler.bind(SingleSaliencyImage.events.onPredictionClick, ({prediction, caller}) => {
        selectors.predictionFn.property('value', prediction)
        state.predictionFn(prediction)
        eventHelpers.updatePage(state)
    })

}