export interface SaliencyImg {
    image: string,
    bbox: number[],
    saliency: number[],
    label: string,
    prediction: string,
    score: number,
    iou_score: number,
    bbox_proportion_score: number,
    saliency_proportion_score: number,
    features: number[],
    x?: number,
    y?: number,
}