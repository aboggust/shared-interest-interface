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
            imageIDs: imageIDs,
            scoreFn: scoreFn
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
    getSaliencyImage(imageID: string, scoreFn: string): Promise<SaliencyImg> {
        const imagesToSend = {
            imageID: imageID,
            scoreFn: scoreFn
        }
        const url = makeUrl(this.baseURL + "/get-saliency-image", imagesToSend)
        return d3.json(url)
    }


    /**
     * Get image IDs
     */
    getImages(sortBy: number, predictionFn: string, scoreFn: string, labelFilter: string): Promise<string[]> {
        const toSend = {
            sortBy: sortBy,
            predictionFn: predictionFn,
            scoreFn: scoreFn,
            labelFilter: labelFilter,
        }
        const url = makeUrl(this.baseURL + "/get-images", toSend)
        return d3.json(url)
    }

    /**
     * Get all dataset predictions
     */
    getPredictions(): Promise<string[]> {
        const toSend = {}
        const url = makeUrl(this.baseURL + "/get-predictions", toSend)
        return d3.json(url)
    }

    /**
     * Get all dataset labels
     */
    getLabels(): Promise<string[]> {
        const toSend = {}
        const url = makeUrl(this.baseURL + "/get-labels", toSend)
        return d3.json(url)
    }

    /**
     * Get the hisotgram bins for the scoreFn scores of the imageIDs.
     *
     * @imageIDs: list of string image ids to get saliency image objects for
     * @scoreFn: string score function name
     */
    binScores(imageIDs: string[], scoreFn: string): Promise<BinObject[]> {
        const imagesToSend = {
            imageIDs: imageIDs,
            scoreFn: scoreFn
        }
        const url = makeUrl(this.baseURL + "/bin-scores")
        const payload = toPayload(imagesToSend)
        return d3.json(url, payload)
    }


};
