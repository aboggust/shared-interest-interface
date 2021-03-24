export interface SaliencyImg {
    image: string,
    bbox: string[], // Already converted to string in the backend
    saliency: string[], // Already converted to string in the backend
    label: string,
    prediction: string,
    score: number,
    iou: number,
    ground_truth_coverage: number,
    explanation_coverage: number,
    features?: number[],
    x?: number,
    y?: number,
}

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

export interface TextScores {
    iou: number
    recall: number // Same as ground_truth_coverage
    precision: number // Same as explanation_coverage
}

export interface SaliencyText {
    words: string[]
    label: 0 | 1
    prediction: 0 | 1
    explanation_inds: number[]
    ground_truth_inds: number[]
    scores: TextScores
    ground_truth_coverage?: number
    explanation_coverage?: number
    iou?: number
    score?: number
}