export interface SaliencyImg {
    image: string,
    vanilla_gradients: string,
    integrated_gradients: string,
    bbox: string[], // Already converted to string in the backend
    lime: string[], // Already converted to string in the backend
    label: string,
    prediction: string,
    score: number,
    iou: number,
    ground_truth_coverage: number,
    explanation_coverage: number,
    features?: number[],
    x?: number,
    y?: number,
    vanilla_gradients_score: number,
    integrated_gradients_score: number;
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