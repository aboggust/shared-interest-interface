import * as d3 from 'd3'
import { LazySaliencyImages } from "./vis/LazySaliencyImages"
import { SingleSaliencyImage } from "./vis/SingleSaliencyImage"
import { Histogram } from './vis/Histogram'
import { ConfusionMatrix } from './vis/ConfusionMatrix'
import { SimpleEventHandler } from './etc/SimpleEventHandler'
import { API } from './api/mainApi'
import { State } from './state'
import { modelOptions, methodOptions, sortByOptions, predictionFnOptions, scoreFnOptions, labelFilterOptions } from './etc/selectionOptions'
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
            const imageIDs = api.getImages(state.sortBy(), state.predictionFn(), state.scoreFn(), state.labelFilter())
            imageIDs.then(IDs => {
                state.numImages(IDs.length)
                const imgData = {
                    imgIDs: IDs,
                    scoreFn: state.scoreFn()
                }
                vizs.saliencyImages.update(imgData)
            })
        },

        updatePage: (state: State) => {
            vizs.saliencyImages.clear()
            const imageIDs = api.getImages(state.sortBy(), state.predictionFn(), state.scoreFn(), state.labelFilter())
            selectors.body.style('cursor', 'progress')
            imageIDs.then(IDs => {
                state.numImages(IDs.length)
                vizs.saliencyImages.update({imgIDs: IDs, scoreFn: state.scoreFn()})

                // Update histogram
                api.binScores(IDs, state.scoreFn()).then(bins => {
                    vizs.histogram.update(bins)
                })

                var imagePromiseArray = api.getSaliencyImages(IDs, state.scoreFn())
                imagePromiseArray.then(images => {
                    // Update sidebar
                    vizs.confusionMatrix.update(images)

                    // Finished async calls
                    selectors.body.style('cursor', 'default')
                })
            })
        },

    }

    /**
     * Initialize the application from the state
     *
     * @param state the state of the application
     */
    async function initializeFromState(state: State) {
        // Initialize state
        const numImageRows = Math.floor(selectors.imagesPanel.property('clientHeight') / 230);
        const numImageCols = Math.floor(selectors.imagesPanel.property('clientWidth') / 200);

        // Fill in label options
        const labelsPromise = api.getLabels();
        labelsPromise.then(labels => {
            const labelValues = labels.slice();
            labels.splice.apply(labels, [0, 0 as string | number].concat(labelFilterOptions.map(option => option.name)));
            labelValues.splice.apply(labelValues, [0, 0 as string | number].concat(labelFilterOptions.map(option => option.value)));
            selectors.labelFilter.selectAll('option')
                .data(labels)
                .join('option')
                .attr('value', (label, i) => labelValues[i])
                .text(label => label)
        })

        // Fill in prediction options
        const predictionsPromise = api.getPredictions();
        predictionsPromise.then(predictions => {
            const predictionValues = predictions.slice();
            predictions.splice.apply(predictions, [0, 0 as string | number].concat(predictionFnOptions.map(option => option.name)));
            predictionValues.splice.apply(predictionValues, [0, 0 as string | number].concat(predictionFnOptions.map(option => option.value)));
            selectors.predictionFn.selectAll('option')
                .data(predictions)
                .join('option')
                .attr('value', (prediction, i) => predictionValues[i])
                .text(prediction => prediction)
        })

        // Set frontend via state parameters
        selectors.sortBy.property('value', state.sortBy())
        selectors.predictionFn.property('value', state.predictionFn())
        selectors.scoreFn.property('value', state.scoreFn())
        selectors.labelFilter.property('value', state.labelFilter())

        // Get data from state parameters
        eventHelpers.updatePage(state)
    }

    initializeFromState(state)

    /**
     * Binding the event handler
    */
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

    let numLoaded = 0;
    eventHandler.bind(LazySaliencyImages.events.onScreen, ({el, id, scoreFn, caller}) => {
        const img = new SingleSaliencyImage(el, eventHandler)
        api.getSaliencyImage(id, scoreFn).then(salImg => {
            img.update(salImg)
            numLoaded += 1;
            console.log(`I have loaded ${numLoaded} samples`);
        })
    })

}