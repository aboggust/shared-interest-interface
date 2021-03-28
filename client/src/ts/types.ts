export interface Bins {
    x0: number,
    x1: number,
    num: number,
}

export interface ConfusionMatrixI {
    label: string,
    prediction: string,
    count: number,
    mean: number,
}

export interface SaliencyText {
    words: string[]
    label: string
    prediction: number
    explanation_inds: number[]
    ground_truth_inds: number[]
    ground_truth_coverage: number
    explanation_coverage: number
    iou: number
}

export type SaliencyTextMap = {[k: string]: SaliencyText}