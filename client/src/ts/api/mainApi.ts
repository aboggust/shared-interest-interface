import * as d3 from 'd3';
import {bin} from 'd3-array';
import { makeUrl, toPayload } from '../etc/apiHelpers'
import { URLHandler } from '../etc/URLHandler';
import {Bins, SaliencyText } from '../types';

const baseurl = URLHandler.basicURL()

export class API {

    constructor(private baseURL: string = null) {
        if (this.baseURL == null) {
            this.baseURL = baseurl + '/api';
        }
    }

    /**
     * Get the result ids for the images fitting the filter parameters.
     *
     * @param {string} caseStudy - the name of the case study
     * @param {number} sortBy - 1 if sort ascending, -1 if sort descending
     * @param {string} predictionFn - the name of the prediction filter
     * @param {string} scoreFn - the score function name
     * @param {string} labelFilter - the name of the label filter
     * @param {string} iouFilter - min and max iou values
     * @param {string} groundTruthFilter - min and max ground truth coverage values
     * @param {string} explanationFilter - min and max explanation coverage values
     * @return {Promise<string[]>} a list of imageIDs
     */
    getResultIDs(caseStudy: string, sortBy: number, predictionFn: string, scoreFn: string, labelFilter: string,
        iouFilter: number[], explanationFilter: number[], groundTruthFilter: number[], ): Promise<string[]> {
        const toSend = {
            case_study: caseStudy,
            sort_by: sortBy,
            prediction_fn: predictionFn,
            score_fn: scoreFn,
            label_filter: labelFilter,
            iou_min: iouFilter[0],
            iou_max: iouFilter[1],
            ec_min: explanationFilter[0],
            ec_max: explanationFilter[1],
            gtc_min: groundTruthFilter[0],
            gtc_max: groundTruthFilter[1],
        }
        const url = makeUrl(this.baseURL + "/get-result-ids", toSend)
        return d3.json(url)
    }

    /**
     * Get a saliency result objects for a requested result id.
     *
     * @param {string} caseStudy - the name of the case study
     * @param {string} resultID - the result id
     * @param {string} scoreFn - the score function name
     * @return {Promise<SaliencyText>} a SaliencyImg object for the imageID in the caseStudy.
     */
     getResult(caseStudy: string, resultID: string, scoreFn: string): Promise<SaliencyText> {
        const imagesToSend = {
            case_study: caseStudy,
            result_id: resultID,
            score_fn: scoreFn
        }
        const url = makeUrl(this.baseURL + "/get-result", imagesToSend)
        return d3.json(url)
    }

    /**
     * Get all dataset predictions.
     *
     * @param {string} caseStudy - the name of the case study
     * @return {Promise<string[]>} a list of all model predictions for caseStudy
     */
    getPredictions(caseStudy: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            resolve(["0", "1"])
        })
    }

    /**
     * Get all dataset labels.
     *
     * @param {string} caseStudy - the name of the case study
     * @return {Promise<string[]>} a list of all image labels for caseStudy
     */
    getLabels(caseStudy: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            resolve(["0", "1"])
        })
    }

    /**
     * Get the histogram bins for the scoreFn scores of the resultIDS.
     *
     * @param {string} caseStudy - the name of the case study
     * @param {string[]} resultIDs - a list of string result ids
     * @param {string} scoreFn - the score function name
     * @return {Promise<Bins[]>} a list of Bins for the binned scores of the image IDs
     */
     binScores(caseStudy: string, resultIDs: string[], scoreFn: string): Promise<Bins[]> {
        const toSend = {
            case_study: caseStudy,
            result_ids: resultIDs,
            score_fn: scoreFn
        }
        const url = makeUrl(this.baseURL + "/bin-scores")
        const payload = toPayload(toSend)
        return d3.json(url, payload)
    }

    

};
