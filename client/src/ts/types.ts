export interface SaliencyImg {
    image: string,
    bbox: number[],
    saliency: number[],
    label: string,
    prediction: string,
    score: number,
    features: number[],
    x?: number,
    y?: number,
}