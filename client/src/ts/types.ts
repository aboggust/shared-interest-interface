export interface SaliencyImg {
    image: string,
    image_id: string
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

export interface BestPredicted {
    classname: string
    score: number
    saliency_mask: number[][]
}