import * as d3 from 'd3';
import { makeUrl, toPayload } from '../etc/apiHelpers'
import { URLHandler } from '../etc/URLHandler';
import { SaliencyImg, BinObject } from '../types';


const baseurl = URLHandler.basicURL()


export class API {

    constructor(private baseURL: string = null) {
        if (this.baseURL == null) {
            this.baseURL = baseurl + '/api';
        }
    }


    /**
     * Get the saliency image objects for all imageIDs.
     *
     * @imageIDs: list of string image ids to get saliency image objects for
     * @scoreFn: string score function name
     */
    getSaliencyImages(imageIDs: string[], scoreFn: string): Promise<SaliencyImg[]> {
        const imagesToSend = {
            image_ids: imageIDs,
            score_fn: scoreFn
        }
        const url = makeUrl(this.baseURL + "/get-saliency-images")
        const payload = toPayload(imagesToSend)
        return d3.json(url, payload)
    }


    /**
     * Get image IDs
     */
    getImages(sortBy: number, predictionFn: string, scoreFn: string, labelFilter: string): Promise<string[]> {
        const toSend = {
            sort_by: sortBy,
            prediction_fn: predictionFn,
            score_fn: scoreFn,
            label_filter: labelFilter,
        }
        const url = makeUrl(this.baseURL + "/get-images", toSend)
        return d3.json(url)
    }

    /**
     * Get all dataset predictions
     */
    getPredictions(): Promise<string[]> {
        const url = makeUrl(this.baseURL + "/get-predictions")
        return d3.json(url)
    }

    /**
     * Get all dataset labels
     */
    getLabels(): Promise<string[]> {
        const url = makeUrl(this.baseURL + "/get-labels")
        return d3.json(url)
    }

    /**
     * Get the histogram bins for the scoreFn scores of the imageIDs.
     *
     * @imageIDs: list of string image ids to get saliency image objects for
     * @scoreFn: string score function name
     */
    binScores(imageIDs: string[], scoreFn: string): Promise<BinObject[]> {
        const imagesToSend = {
            image_ids: imageIDs,
            score_fn: scoreFn
        }
        const url = makeUrl(this.baseURL + "/bin-scores")
        const payload = toPayload(imagesToSend)
        return d3.json(url, payload)
    }


    /**
     * Get the confusion matrix for the imageIDs.
     *
     * @imageIDs: list of string image ids to get saliency image objects for
     */
    getConfusionMatrix(labelFilter: string, scoreFn: string): Promise<BinObject[]> {
        const toSend = {
            label_filter: labelFilter,
            score_fn: scoreFn
        }
        const url = makeUrl(this.baseURL + "/confusion-matrix", toSend)
        return d3.json(url)
    }




};
