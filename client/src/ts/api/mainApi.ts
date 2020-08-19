import * as d3 from 'd3';
import { makeUrl, toPayload } from '../etc/apiHelpers'
import { URLHandler } from '../etc/URLHandler';
import { SaliencyImg } from '../types';


const baseurl = URLHandler.basicURL()


export class API {

    constructor(private baseURL: string = null) {
        if (this.baseURL == null) {
            this.baseURL = baseurl + '/api';
        }
    }

    /**
     * Example API call, typed with expected response
     *
     * @param firstname
     */
    getASaliencyImage(imageID: string, scoreFn: string): Promise<SaliencyImg> {
        const imageToSend = {
            imageID: imageID,
            scoreFn: scoreFn
        }
        const url = makeUrl(this.baseURL + "/get-a-saliency-image", imageToSend)
        return d3.json(url)
    }

    /**
     * Example API call, typed with expected response
     *
     * @param firstname
     */
    getImages(model: string, method: string, sortBy: number, predictionFn: string, scoreFn: string, labelFilter: string): Promise<string[]> {
        const toSend = {
            model: model,
            method: method,
            sortBy: sortBy,
            predictionFn: predictionFn,
            scoreFn: scoreFn,
            labelFilter: labelFilter,
        }
        const url = makeUrl(this.baseURL + "/get-images", toSend)
        return d3.json(url)
    }


};
