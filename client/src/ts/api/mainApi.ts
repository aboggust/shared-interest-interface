import * as d3 from 'd3';
import {bin} from 'd3-array';
import { makeUrl, toPayload } from '../etc/apiHelpers'
import { URLHandler } from '../etc/URLHandler';
import { SaliencyImg, Bins, ConfusionMatrixI, SaliencyText, SaliencyTextMap } from '../types';

const baseurl = URLHandler.basicURL()

export class API {

    constructor(private baseURL: string = null) {
        if (this.baseURL == null) {
            this.baseURL = baseurl + '/api';
        }
    }

    getTextIDs(caseStudy: string, sortBy: number, predictionFn: string, scoreFn: string, labelFilter: string): Promise<string[]> {
        return this.getSaliencyTexts(sortBy, scoreFn).then(r => {
            let out = Object.entries(r).filter(x => {
                const k = x[0], v = x[1]
                const isCorrect = +v.prediction == +v.label
                const goodLabel = (labelFilter == "") || (v.label.toString() == labelFilter)

                const goodPrediction = predictionFn == "correct_only" ? isCorrect 
                    : predictionFn == "incorrect_only" ? !isCorrect
                    : true
                return goodLabel && goodPrediction
            }).sort((a, b) => {
                const v0 = a[1], v1 = b[1]
                return sortBy * (v0.score - v1.score)
            }).map(x => x[0])

            return out
        })
    }

    getSaliencyText(caseStudy: string, id: (number | string), scoreFn: string): Promise<SaliencyText> {
        return this.getSaliencyTexts(null, scoreFn).then(r => r[id])
    }

    getSaliencyTexts(sortBy: number, scoreFn: string): Promise<SaliencyTextMap> {
        // Local fetch
        const url = baseurl + "/client/assets/beer_advocate.json"
        return d3.json(url).then((r: unknown[]) => {
            let rout = {}
            r.forEach((t:SaliencyText, i) => {
                const t2 = {
                    ...t,
                    ground_truth_coverage: +t.scores.recall,
                    explanation_coverage: +t.scores.precision,
                    iou: +t.scores.iou,
                    id: i,
                }
                rout[i] = {
                    ...t2,
                    score: t2[scoreFn]
                }                 
            })
            return rout
        })
    }

    /**
     * Get a saliency image objects for a requested imageID.
     *
     * @param {string} caseStudy - the name of the case study
     * @param {string[]} imageID - a list of string image ids
     * @param {string} scoreFn - the score function name
     * @return {Promise<SaliencyImg>} a SaliencyImg object for the imageID in the caseStudy.
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
     * Get the histogram bins for the scoreFn scores of the imageIDs.
     *
     * @param {string} caseStudy - the name of the case study
     * @param {string[]} imageIDs - a list of string image ids
     * @param {string} scoreFn - the score function name
     * @return {Promise<Bins[]>} a list of Bins for the binned scores of the image IDs
     */
    async binTextScores(caseStudy: string, IDs: string[], scoreFn: string): Promise<Bins[]> {
        const values = await Promise.all(IDs.map(id => this.getSaliencyText(caseStudy, id, scoreFn)))
        const scores = values.map(v => v.score)
        const binner = bin().domain([0,1])
        return binner(scores).map(b => {
            return {
                x0: b.x0,
                x1: b.x1,
                num: b.length
            }
        })
    }

};
