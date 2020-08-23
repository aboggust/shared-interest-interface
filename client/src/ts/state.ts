import { URLHandler } from "./etc/URLHandler"
// import * as _ from "lodash"
// import * as tp from './types'
// import * as tf from "@tensorflow/tfjs"

interface URLParameters {
    scoreFn: string,
    sortBy: number,
    predictionFn: string,
    page: number,
    numPerPage: number,
    labelFilter: string,
}

interface StateConf {
}

export class State {
    private _url: Partial<URLParameters> = {}
    private _conf: Partial<StateConf> = {}

    imagesPerPage: number
    imageLength: number
    maxPageNum: number

    constructor() {
        this.fromURL()
        this.toURL(false)
        this.imagesPerPage = null
        this.imageLength = null
        this.maxPageNum = null
    }

    /**
     * Reads app state from the URL, setting default values as necessary
     */
    fromURL() {
        const params = URLHandler.parameters

        this._url = {
            scoreFn: params['scoreFn'] || 'saliency_proportion_score',
            sortBy: params['sortBy'] || 1,
            predictionFn: params['predictionFn'] || 'all_images',
            page: params['page'] || 0,
            labelFilter: params['labelFilter'] || [],
        }
    }

    toURL(updateHistory = false) {
        URLHandler.updateUrl(this._url, updateHistory)
    }

    scoreFn(): string
    scoreFn(val: string): this
    scoreFn(val?) {
        if (val == null) return this._url.scoreFn
        this._url.scoreFn = val
        this.toURL()
        return this
    }

    sortBy(): number
    sortBy(val: number): this
    sortBy(val?) {
        if (val == null) return this._url.sortBy
        this._url.sortBy = val
        this.toURL()
        return this
    }

    predictionFn(): string
    predictionFn(val: string): this
    predictionFn(val?) {
        if (val == null) return this._url.predictionFn
        this._url.predictionFn = val
        this.toURL()
        return this
    }

    page(): number
    page(val: number): this
    page(val?) {
        if (val == null) return this._url.page
        this._url.page = val
        this.toURL()
        return this
    }

    numPerPage(): number
    numPerPage(val: number): this
    numPerPage(val?) {
        if (val == null) return this.imagesPerPage
        this.imagesPerPage = val
        return this
    }

    labelFilter(): string
    labelFilter(filter: string): this
    labelFilter(filter?) {
        if (filter == null) return this._url.labelFilter
        this._url.labelFilter = filter
        this.toURL()
        return this
    }

    numImages(): number
    numImages(val: number): this
    numImages(val?) {
        if (val == null) return this.imageLength
        this.imageLength = val
        this.maxPageNum = Math.ceil(this.imageLength / this.numPerPage()) - 1
        return this
    }

    maxPage(): number
    maxPage() {
        return this.maxPageNum
    }
}