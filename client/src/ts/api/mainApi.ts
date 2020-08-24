import * as d3 from 'd3';
import { makeUrl, toPayload } from '../etc/apiHelpers'
import { URLHandler } from '../etc/URLHandler';
import { SaliencyImg, Bins, ConfusionMatrixI } from '../types';


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
    getSaliencyImages(caseStudy: string, imageIDs: string[], scoreFn: string): Promise<SaliencyImg[]> {
        const imagesToSend = {
            case_study: caseStudy,
            image_ids: imageIDs,
            score_fn: scoreFn
        }
        const url = makeUrl(this.baseURL + "/get-saliency-images")
        const payload = toPayload(imagesToSend)
        return d3.json(url, payload)
    }

    /**
     * Get a saliency image objects for a requested fname
     *
     * @imageID: string image id to get saliency image object for
     * @scoreFn: string score function name
     */
    getSaliencyImage(caseStudy: string, imageID: string, scoreFn: string): Promise<SaliencyImg> {
        const imagesToSend = {
            case_study: caseStudy,
            image_id: imageID,
            score_fn: scoreFn
        }
        const url = makeUrl(this.baseURL + "/get-saliency-image", imagesToSend)
        return d3.json(url)
    }


    /**
     * Get image IDs
     */
    getImages(caseStudy: string, sortBy: number, predictionFn: string, scoreFn: string, labelFilter: string): Promise<string[]> {
        const toSend = {
            case_study: caseStudy,
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
    getPredictions(caseStudy: string): Promise<string[]> {
        const toSend = {
            case_study: caseStudy
        }
        const url = makeUrl(this.baseURL + "/get-predictions", toSend)
        return d3.json(url)
    }

    /**
     * Get all dataset labels
     */
    getLabels(caseStudy: string): Promise<string[]> {
        const toSend = {
            case_study: caseStudy
        }
        const url = makeUrl(this.baseURL + "/get-labels", toSend)
        return d3.json(url)
    }

    /**
     * Get the histogram bins for the scoreFn scores of the imageIDs.
     *
     * @imageIDs: list of string image ids to get saliency image objects for
     * @scoreFn: string score function name
     */
    binScores(caseStudy: string, imageIDs: string[], scoreFn: string): Promise<Bins[]> {
        const imagesToSend = {
            case_study: caseStudy,
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
    getConfusionMatrix(caseStudy: string, labelFilter: string, scoreFn: string): Promise<ConfusionMatrixI[]> {
        const toSend = {
            case_study: caseStudy,
            label_filter: labelFilter,
            score_fn: scoreFn
        }
        const url = makeUrl(this.baseURL + "/confusion-matrix", toSend)
        return d3.json(url)
    }




};
