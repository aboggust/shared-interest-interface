export const caseStudyOptions = [
    { name: "Vehicle", value: "data_vehicle" },
    { name: "Dogs", value: "data_dogs" },
    { name: "Melanoma", value: "data_melanoma" },
    { name: "Text", value: "text" },
    { name: "Beer Sentiment", value: "data_beer" },
]

export const sortByOptions = [
    { name: "Increasing", value: 1 },
    { name: "Decreasing", value: -1 },
]

export const scoreFnOptions = [
    { name: "Explanation Coverage", value: 'explanation_coverage'},
    { name: "Ground Truth Coverage", value: 'ground_truth_coverage' },
    { name: "IoU", value: 'iou' },
]

export const predictionFnOptions = [
    { name: "All", value: 'all' },
    { name: "Correct", value: 'correct_only' },
    { name: "Incorrect", value: 'incorrect_only' },
]

export const labelFilterOptions = [
    { name: "All", value: '' },
]