import * as d3 from 'd3'
import { HTMLList, SVGList } from './vis/ExampleComponent'
import { SaliencyImages } from './vis/SaliencyImages'
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
        previousPageButton: d3.select("#previous-page"),
        nextPageButton: d3.select("#next-page"),
    }

    const vizs = {
        histogram: new Histogram(<HTMLElement>selectors.sidebar.node(), eventHandler),
        confusionMatrix: new ConfusionMatrix(<HTMLElement>selectors.sidebar.node(), eventHandler),
        saliencyImages: new SaliencyImages(<HTMLElement>selectors.imagesPanel.node(), eventHandler),
    }

    const eventHelpers = {
        updateImages: (state: State) => {
            const imageIDs = api.getImages(state.sortBy(), state.predictionFn(), state.scoreFn(), state.labelFilter())
            imageIDs.then(IDs => {
                state.numImages(IDs.length)
                eventHelpers.updatePageButtons(state)
                const startIndex = state.numPerPage() * state.page()
                const pageIDs = IDs.slice(startIndex, startIndex + state.numPerPage())
                var imagePromiseArray = api.getSaliencyImages(pageIDs, state.scoreFn());
                imagePromiseArray.then(images => {
                    vizs.saliencyImages.update(images)
                })
            })
        },

        updatePage: (state: State) => {
            const imageIDs = api.getImages(state.sortBy(), state.predictionFn(), state.scoreFn(), state.labelFilter())
            selectors.body.style('cursor', 'progress')
            imageIDs.then(IDs => {
                state.numImages(IDs.length)
                eventHelpers.updatePageButtons(state)

                // Update histogram
                api.binScores(IDs, state.scoreFn()).then(bins => {
                    vizs.histogram.update(bins)
                })

                // Update confusion matrix
                api.getConfusionMatrix(state.labelFilter(), state.scoreFn()).then(confusionMatrix => {
                    vizs.confusionMatrix.update(confusionMatrix)
                })

                // Update images
                const startIndex = state.numPerPage() * state.page()
                const pageImageIDs = IDs.slice(startIndex, startIndex + state.numPerPage())
                api.getSaliencyImages(pageImageIDs, state.scoreFn()).then(pageImages => {
                    vizs.saliencyImages.update(pageImages)
                })

                // Finished async calls
                selectors.body.style('cursor', 'default')
            })
        },

        updateImagesPerPage: (state: State) => {
            const numImageRows = Math.floor(selectors.imagesPanel.property('clientHeight') / 230));
            const numImageCols = Math.floor(selectors.imagesPanel.property('clientWidth') / 200));
            const numPerPage = numImageRows * numImageCols;
            if (state.numPerPage() != numPerPage) {
                state.numPerPage(numPerPage);
                eventHelpers.updateImages(state);
            }
        },

        updatePageButtons: (state: State) => {
            if (state.page() == 0) {
                selectors.previousPageButton.classed('disabled', true);
            } else {
                selectors.previousPageButton.classed('disabled', false);
            };

            if (state.page() < state.maxPage()) {
                selectors.nextPageButton.classed('disabled', false);
            } else {
                selectors.nextPageButton.classed('disabled', true);
            };
        },
    }

    /**
     * Initialize the application from the state
     *
     * @param state the state of the application
     */
    async function initializeFromState(state: State) {
        // Initialize state
        const numImageRows = Math.floor(selectors.imagesPanel.property('clientHeight') / 230));
        const numImageCols = Math.floor(selectors.imagesPanel.property('clientWidth') / 200));
        state.numPerPage(numImageRows * numImageCols);

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
            selectors.labelFilter.property('value', state.labelFilter())
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
            selectors.predictionFn.property('value', state.predictionFn())
        })

        // Set frontend via state parameters
        selectors.sortBy.property('value', state.sortBy())
        selectors.scoreFn.property('value', state.scoreFn())


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
        state.page(0)
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
        state.page(0)
        eventHelpers.updatePage(state)
    });

    selectors.previousPageButton.on('click', () => {
        const currentPage = state.page()
        if (currentPage > 0) {
            state.page(currentPage - 1)
            eventHelpers.updateImages(state)
        };
    });

    selectors.nextPageButton.on('click', () => {
        if (!selectors.nextPageButton.classed('disabled')) {
            const currentPage = state.page()
            state.page(currentPage + 1)
            eventHelpers.updateImages(state)
        }
    });

    selectors.window.on('resize', () => {
        eventHelpers.updateImagesPerPage(state)
    });

}