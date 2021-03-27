import * as d3 from 'd3'
import { D3Sel } from "./etc/Util"
import { Histogram } from './vis/Histogram'
import { SimpleEventHandler } from './etc/SimpleEventHandler'
import { API } from './api/mainApi'
import { State, URLParameters } from './state'
import { caseStudyOptions, sortByOptions, predictionFnOptions, scoreFnOptions, labelFilterOptions } from './etc/selectionOptions'
import { SaliencyTextViz } from "./vis/SaliencyTextRow"
import { SaliencyTexts } from "./vis/SaliencyTexts"

/**
 * Render static elements needed for interface
 */
function init(base: D3Sel) {
    const html = `
    <!--  Filter Controls  -->
    <div class="controls container-md cont-nav">
        <div class="form-row">
            <div class="col-sm-2">
                <div class="input-group input-group-sm mb-3">
                    <div class="input-group-prepend">
                        <label class="input-group-text" for="case-study-select">Demo</label>
                    </div>
                    <select class="custom-select custom-select-sm ID_case-study-select">
                        <!-- Fill in from data in TS now -->
                    </select>
                </div>
            </div>

            <div class="col-sm-3">
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

    <!--  Results  -->
    <div class="ID_main">
        <div class="ID_sidebar"></div>
        <div class="ID_mainpage">
            <div class="ID_results-panel"></div>
        </div>

    </div>
    `

    base.html(html)
}

/**
 * Main functionality in the below function
 */
export function main(el: Element, ignoreUrl: boolean = false, stateParams: Partial<URLParameters> = {}, freezeParams: boolean = false) {
    const base = d3.select(el)

    const eventHandler = new SimpleEventHandler(el)
    const api = new API()
    const state = new State(ignoreUrl, stateParams, freezeParams)

    init(base)
    const selectors = {
        body: d3.select('body'),
        main: base.select('.ID_main'),
        navBar: base.select('.controls'),
        mainPage: base.select('.ID_mainpage'),
        resultsPanel: base.select('.ID_results-panel'),
        sidebar: base.select('.ID_sidebar'),
        caseStudy: base.select('.ID_case-study-select'),
        caseStudyListOptions: base.select('.ID_case-study-select').selectAll('option')
            .data(caseStudyOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
        scoreFn: base.select('.ID_scorefn-select'),
        scoreFnListOptions: base.select('.ID_scorefn-select').selectAll('option')
            .data(scoreFnOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
        sortBy: base.select('.ID_sort-by-select'),
        sortByListOptions: base.select('.ID_sort-by-select').selectAll('option')
            .data(sortByOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
        predictionFn: base.select('.ID_prediction-filter'),
        predictionFnListOptions: base.select('.ID_prediction-filter').selectAll('option')
            .data(predictionFnOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
        labelFilter: base.select('.ID_label-filter'),
        labelFilterListOptions: base.select('.ID_label-filter').selectAll('option')
            .data(labelFilterOptions)
            .join('option')
            .attr('value', option => option.value)
            .text(option => option.name),
    }

    const vizs = {
        histogram: new Histogram(<HTMLElement>selectors.sidebar.node(), eventHandler),
        results: new SaliencyTexts(<HTMLElement>selectors.resultsPanel.node(), eventHandler)
    }

    const eventHelpers = {
        /**
        * Update the results panel.
        * @param {State} state - the current state of the application.
        */
        updateResults: (state: State) => {
            api.getResultIDs(state.caseStudy(), state.sortBy(), state.predictionFn(), state.scoreFn(), state.labelFilter()).then(IDs => {
                vizs.results.update(IDs)
            })
        },

        /**
        * Update the results panel, histogram, and confusion matrix.
        * @param {State} state - the current state of the application.
        */
        updatePage: (state: State) => {
            api.getResultIDs(state.caseStudy(), state.sortBy(), state.predictionFn(), state.scoreFn(), state.labelFilter()).then(IDs => {
                vizs.results.update(IDs)

                api.binScores(state.caseStudy(), IDs, state.scoreFn()).then(bins => {
                    vizs.histogram.update(bins)
                })
            })
        },

        /**
        * Update the label drop down values.
        * @param {State} state - the current state of the application.
        */
        updateLabels: (state: State) => {
            api.getLabels(state.caseStudy()).then(labels => {
                const labelValues = labels.slice();
                labels.splice.apply(labels, [0, 0 as string | number].concat(labelFilterOptions.map(option => option.name)));
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
                const predictionValues = predictions.slice();
                predictions.splice.apply(predictions, [0, 0 as string | number].concat(predictionFnOptions.map(option => option.name)));
                predictionValues.splice.apply(predictionValues, [0, 0 as string | number].concat(predictionFnOptions.map(option => option.value)));
                selectors.predictionFn.selectAll('option')
                    .data(predictions)
                    .join('option')
                    .attr('value', (prediction, i) => predictionValues[i])
                    .attr('disabled', state.isFrozen('predictionFn'))
                    .text(prediction => prediction)
                selectors.predictionFn.property('value', state.predictionFn())
            })
        }
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
        state.predictionFn('all')
        eventHelpers.updatePredictions(state)
        eventHelpers.updatePage(state)
    });

    selectors.sortBy.on('change', () => {
        /* When the sort by value changes, update the results panel. */
        const sortByValue = selectors.sortBy.property('value')
        state.sortBy(sortByValue)
        eventHelpers.updateResults(state)
    });

    selectors.predictionFn.on('change', () => {
        /* When the prediction function changes, update the page. */
        const predictionValue = selectors.predictionFn.property('value')
        state.predictionFn(predictionValue)
        eventHelpers.updatePage(state)
    });

    selectors.scoreFn.on('change', () => {
        /* When the score function changes, update the page. */
        const scoreValue = selectors.scoreFn.property('value')
        state.scoreFn(scoreValue)
        eventHelpers.updatePage(state)
    });

    selectors.labelFilter.on('change', () => {
        /* When the label filter changes, update the page. */
        const labelFilter = selectors.labelFilter.property('value')
        state.labelFilter(labelFilter)
        eventHelpers.updatePage(state)
    });

    eventHandler.bind(SaliencyTexts.events.onScreen, ({ el, id, caller }) => {
        /* Lazy load the saliency results. */
        const row = new SaliencyTextViz(el, eventHandler)
        api.getResult(state.caseStudy(), id, state.scoreFn()).then(salTxt => {
            row.update(salTxt)
        })
    })

}