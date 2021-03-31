import { URLHandler } from "./etc/URLHandler"

export interface URLParameters {
    caseStudy: string,
    scoreFn: string,
    sortBy: number,
    paintBrushR: number,
    predictionFn: string,
    labelFilter: string,
    selectedImage: string,
}

interface StateConf { }

export class State {
    private _url: Partial<URLParameters> = {}
    private _conf: Partial<StateConf> = {}

    ignoreUrl: boolean
    freeze: boolean
    frozenParams: Set<string> = new Set([])

    /**
     * 
     * @param ignoreUrl - if provided, do not update URL parameters when state changes or initialize state from URL
     * @param params - preset state to desired configuration
     * @param freeze - if true, any provided state in 'params' will be recorded as a 'frozen' state that cannot be
     *                 modified by the user
     */
    constructor(ignoreUrl = false, params: Partial<URLParameters> = {}, freeze: boolean = false) {
        this.ignoreUrl = ignoreUrl
        this.freeze = freeze
        this.fromURL()
        this.fromOptions(params)
        this.toURL(false)
    }

    /**
     * Reads app state from the URL, setting default values as necessary.
     */
    fromURL() {
        const params = this.ignoreUrl ? {} : URLHandler.parameters

        this._url = {
            caseStudy: params['caseStudy'] || 'data_dogs_10',
            scoreFn: params['scoreFn'] || 'iou',
            selectedImage: params['selectedImage'] || "n02085620_3360",
            sortBy: 1,
            predictionFn: 'all_images',
            labelFilter: '',
            paintBrushR: params['paintBrushR'] || 10,
        }
    }

    fromOptions(params: Partial<URLParameters>) {
        Object.keys(params).forEach(k => {
            this._url[k] = params[k]
            this.freeze && this.frozenParams.add(k)
        })
    }

    toURL(updateHistory = false) {
        this.ignoreUrl || URLHandler.updateUrl(this._url, updateHistory)
    }

    /**
     * Check if `k` is supposed to be a frozen view
     * 
     * @param k - URL parameter to check if frozen
     */
    isFrozen(k: string) {
        if (this.frozenParams.has(k)) return true
        return null // Allows `sel.attr("disabled", state.isFrozen(k))`
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

    selectedImage(): string
    selectedImage(value: string): this
    selectedImage(value?) {
        if (value == null) return this._url.selectedImage
        this._url.selectedImage = value
        this.toURL()
        return this
    }

    paintBrushR(): number
    paintBrushR(value: number): this
    paintBrushR(value?) {
        if (value == null) return this._url.paintBrushR
        this._url.paintBrushR = value
        this.toURL()
        return this
    }
}