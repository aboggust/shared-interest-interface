import { URLHandler } from "./etc/URLHandler"
// import * as _ from "lodash"
// import * as tp from './types'
// import * as tf from "@tensorflow/tfjs"

interface URLParameters {
    model: string,
    method: string,
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
    imageLength = null
    maxPageNum = null

    constructor() {
        this.fromURL()
        this.toURL(false)
    }

    /**
     * Reads app state from the URL, setting default values as necessary
     */
    fromURL() {
        const params = URLHandler.parameters

        this._url = {
            model: params['model'] || 'resnet50',
            method: params['method'] || 'lime',
            scoreFn: params['scoreFn'] || 'saliency_proportion_score',
            sortBy: params['sortBy'] || 1,
            predictionFn: params['predictionFn'] || 'all_images',
            page: params['page'] || 0,
            numPerPage: params['numPerPage'] || 6,
            labelFilter: params['labelFilter'] || [],
        }
    }

    toURL(updateHistory = false) {
        URLHandler.updateUrl(this._url, updateHistory)
    }

    model(): string
    model(val: string): this
    model(val?) {
        if (val == null) return this._url.model
        this._url.model = val
        this.toURL()
        return this
    }

    method(): string
    method(val: string): this
    method(val?) {
        if (val == null) return this._url.method
        this._url.method = val
        this.toURL()
        return this
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
    numPerPage() {
        return this._url.numPerPage
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
    }

    maxPage(): number
    maxPage() {
        return this.maxPageNum
    }
}