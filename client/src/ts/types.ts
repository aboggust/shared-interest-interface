export interface SaliencyImg {
    image: string,
    bbox: string[], // Already converted to string in the backend
    saliency: string[], // Already converted to string in the backend
    label: string,
    prediction: string,
    score: number,
    iou_score: number,
    bbox_proportion_score: number,
    saliency_proportion_score: number,
    features?: number[],
    x?: number,
    y?: number,
}