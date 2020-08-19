export const modelOptions = [
    { name: "ResNet50", value: "resnet50" },
]

export const methodOptions = [
    { name: "LIME", value: "lime" },
]

export const sortByOptions = [
    { name: "Score Increasing", value: 1 },
    { name: "Score Decreasing", value: -1 },
]

export const scoreFnOptions = [
    { name: "Saliency Coverage", value: 'saliency_proportion_score'},
    { name: "Bbox Coverage", value: 'bbox_proportion_score' },
    { name: "IOU", value: 'iou_score' },
]

export const numPerPageOptions = [
    { name: "10", value: 10 },
]

export const predictionFnOptions = [
    { name: "All", value: 'all_images' },
    { name: "Correct", value: 'correct_only' },
    { name: "Incorrect", value: 'incorrect_only' },
]

export const labelFilterOptions = [
    { name: "All", value: '' },
]