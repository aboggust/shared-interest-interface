export const caseStudyOptions = [
    { name: "Vehicle", value: "data_vehicle" },
    { name: "Dogs", value: "data_dogs" },
    { name: "Melanoma", value: "data_melanoma" },
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
    { name: "All", value: 'all_images' },
    { name: "Correct", value: 'correct_only' },
    { name: "Incorrect", value: 'incorrect_only' },
]

export const labelFilterOptions = [
    { name: "All", value: '' },
]

export const caseOptions = [
    { name: "Human Aligned", value: '' },
    { name: "Sfficient Subset", value: '' },
    { name: "Sufficient Background", value: '' },
    { name: "Context Dependant", value: '' },
    { name: "Confuser", value: '' },
    { name: "Too Focused", value: '' },
    { name: "Distracted", value: '' },
    { name: "Context Confusion", value: '' },
]