export const caseStudyOptions = [
    { name: "Vehicle", value: "data_vehicle" },
    { name: "Dogs", value: "data_dogs" },
    { name: "Melanoma", value: "data_melanoma" },
]

export const sortByOptions = [
    { name: "Score Increasing", value: 1 },
    { name: "Score Decreasing", value: -1 },
]

export const scoreFnOptions = [
    { name: "Explanation Coverage", value: 'saliency_proportion_score'},
    { name: "Ground Truth Coverage", value: 'bbox_proportion_score' },
    { name: "IoU", value: 'iou_score' },
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