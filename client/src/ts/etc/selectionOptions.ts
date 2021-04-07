export const caseStudyOptions = [
    { name: "ImageNet Vehicles [LIME]", value: "data_vehicle" },
    { name: "ImageNet Dogs [LIME]", value: "data_dogs" },
    { name: "Melanoma [LIME]", value: "data_melanoma" },
]

export const sortByOptions = [
    { name: "Increasing", value: 1 },
    { name: "Decreasing", value: -1 },
]

export const scoreFnOptions = [
    { name: "Saliency Coverage", value: 'explanation_coverage' },
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
    { name: "Sufficient Context", value: 'sufficient_context' },
    { name: "Context Dependent", value: 'context_dependent' },
    { name: "Confuser", value: 'confuser' },
    { name: "Insufficient Subset", value: 'insufficient_subset' },
    { name: "Distracted", value: 'distracted' },
    { name: "Context Confusion", value: 'context_confusion' },
]

const full = [0.0, 1.0]
const low = [0.0, 0.1]
const high = [0.7, 1.0]

export const caseValues = {
    "default":
    {
        'scores': { "iou": full, 'ground_truth_coverage': full, 'explanation_coverage': full },
        'prediction': 'all_images',
        'description': '',
        'selectedScore': 'explanation_coverage',
        'sortBy': 1,
    },
    "human_aligned":
    {
        'scores': { "iou": high, 'ground_truth_coverage': full, 'explanation_coverage': full },
        'prediction': 'correct_only',
        'description': 'Correctly classified images with high IoU.',
        'selectedScore': 'iou',
        'sortBy': -1,
    },
    "sufficient_subset":
    {
        'scores': { "iou": full, 'ground_truth_coverage': low, 'explanation_coverage': high },
        'prediction': 'correct_only',
        'description': 'Correctly classified images with high Ground Truth Coverage and low Saliency Coverage.',
        'selectedScore': 'explanation_coverage',
        'sortBy': -1,
    },
    "sufficient_context":
    {
        'scores': { "iou": low, 'ground_truth_coverage': full, 'explanation_coverage': full },
        'prediction': 'correct_only',
        'description': 'Correctly classified images with low IoU.',
        'selectedScore': 'iou',
        'sortBy': 1,
    },
    "context_dependent":
    {
        'scores': { "iou": full, 'ground_truth_coverage': high, 'explanation_coverage': low },
        'prediction': 'correct_only',
        'description': 'Correctly classified images with low Ground Truth Coverage and high Saliency Coverage.',
        'selectedScore': 'ground_truth_coverage',
        'sortBy': -1,
    },
    "confuser":
    {
        'scores': { "iou": high, 'ground_truth_coverage': full, 'explanation_coverage': full },
        'prediction': 'incorrect_only',
        'description': 'Incorrectly classified images with high IoU.',
        'selectedScore': 'iou',
        'sortBy': -1,
    },
    "insufficient_subset":
    {
        'scores': { "iou": full, 'ground_truth_coverage': low, 'explanation_coverage': high },
        'prediction': 'incorrect_only',
        'description': 'Incorrectly classified images with high Ground Truth Coverage and low Saliency Coverage.',
        'selectedScore': 'explanation_coverage',
        'sortBy': -1,
    },
    "distracted":
    {
        'scores': { "iou": low, 'ground_truth_coverage': full, 'explanation_coverage': full },
        'prediction': 'incorrect_only',
        'description': 'Inorrectly classified images with low IoU.',
        'selectedScore': 'iou',
        'sortBy': 1,
    },
    "context_confusion":
    {
        'scores': { "iou": full, 'ground_truth_coverage': high, 'explanation_coverage': low },
        'prediction': 'incorrect_only',
        'description': 'Incorrectly classified images with low Ground Truth Coverage and high Saliency Coverage.',
        'selectedScore': 'ground_truth_coverage',
        'sortBy': -1,
    },
}