import { URLHandler } from "./etc/URLHandler"

export interface URLParameters {
    caseStudy: string,
    scoreFn: string,
    sortBy: number,
    predictionFn: string,
    labelFilter: string,
}

interface StateConf {
}

export class State {
    private _url: Partial<URLParameters> = {}
    private _conf: Partial<StateConf> = {}

    ignoreUrl: boolean

    constructor(ignoreUrl=false, params:Partial<URLParameters>={}) {
        this.ignoreUrl = ignoreUrl
        this.fromURL()
        this.fromOptions(params)
        this.toURL(false)
    }

    /**
     * Reads app state from the URL, setting default values as necessary
     */
    fromURL() {
        const params = this.ignoreUrl ? {} : URLHandler.parameters

        this._url = {
            caseStudy: params['caseStudy'] || 'data_vehicle',
            scoreFn: params['scoreFn'] || 'saliency_proportion_score',
            sortBy: params['sortBy'] || 1,
            predictionFn: params['predictionFn'] || 'all_images',
            labelFilter: params['labelFilter'] || '',
        }
    }

    fromOptions(params: Partial<URLParameters>) {
        Object.keys(params).forEach(k => {
            this._url[k] = params[k]
        })
    }

    toURL(updateHistory = false) {
        this.ignoreUrl || URLHandler.updateUrl(this._url, updateHistory)
    }

    caseStudy(): string
    caseStudy(val): this
    caseStudy(val?) {
        if (val == null) return this._url.caseStudy
        this._url.caseStudy = val
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

    labelFilter(): string
    labelFilter(filter: string): this
    labelFilter(filter?) {
        if (filter == null) return this._url.labelFilter
        this._url.labelFilter = filter
        this.toURL()
        return this
    }
}