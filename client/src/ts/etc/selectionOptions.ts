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
    { name: "--- Select a preset to explore ---", value: 'default' },
    { name: "Human Aligned", value: 'human_aligned' },
    { name: "Sufficient Subset", value: 'sufficient_subset' },
    { name: "Sufficient Background", value: 'sufficient_background' },
    { name: "Context Dependant", value: 'context_dependant' },
    { name: "Confuser", value: 'confuser' },
    { name: "Too Focused", value: 'too_focused' },
    { name: "Distracted", value: 'distracted' },
    { name: "Context Confusion", value: 'context_confusion' },
]

export const caseValues = {
    "default":  
        {'scores': {"iou": [0.0, 1.0], 'ground_truth_coverage': [0.0, 1.0], 'explanation_coverage': [0.0, 1.0]},
         'prediction': 'all_images',
         'description': ''},
    "human_aligned":
        {'scores': {"iou": [0.8, 1.0], 'ground_truth_coverage': [0.0, 1.0], 'explanation_coverage': [0.0, 1.0]},
         'prediction': 'correct_only',
         'description': 'Correctly classified images with high IoU.'},
    "sufficient_subset":
        {'scores': {"iou": [0.0, 1.0], 'ground_truth_coverage': [0.8, 1.0], 'explanation_coverage': [0.0, 0.2]},
         'prediction': 'correct_only',
         'description': 'Correctly classified images with high Ground Truth Coverage and low Explanation Coverage.'},
    "sufficient_background":
        {'scores': {"iou": [0.0, 1.0], 'ground_truth_coverage': [0.0, 0.2], 'explanation_coverage': [0.0, 1.0]},
         'prediction': 'correct_only',
         'description': 'Correctly classified images with low Ground Truth Coverage.'},
    "context_dependant":
        {'scores': {"iou": [0.0, 1.0], 'ground_truth_coverage': [0.0, 0.2], 'explanation_coverage': [0.8, 1.0]},
         'prediction': 'correct_only',
         'description': 'Correctly classified images with low Ground Truth Coverage and high Explanation Coverage.'},
    "confuser":
        {'scores': {"iou": [0.8, 1.0], 'ground_truth_coverage': [0.0, 1.0], 'explanation_coverage': [0.0, 1.0]},
        'prediction': 'incorrect_only',
        'description': 'Incorrectly classified images with high IoU.'},
    "too_focused":
        {'scores': {"iou": [0.0, 1.0], 'ground_truth_coverage': [0.8, 1.0], 'explanation_coverage': [0.0, 0.2]},
        'prediction': 'incorrect_only',
        'description': 'Incorrectly classified images with high Ground Truth Coverage and low Explanation Coverage.'},
    "distracted":
        {'scores': {"iou": [0.0, 1.0], 'ground_truth_coverage': [0.0, 0.2], 'explanation_coverage': [0.0, 1.0]},
        'prediction': 'incorrect_only',
        'description': 'Inorrectly classified images with low Ground Truth Coverage.'},
    "context_confusion":
        {'scores': {"iou": [0.0, 1.0], 'ground_truth_coverage': [0.0, 0.2], 'explanation_coverage': [0.8, 1.0]},
        'prediction': 'incorrect_only',
        'description': 'Incorrectly classified images with low Ground Truth Coverage and high Explanation Coverage.'},
}