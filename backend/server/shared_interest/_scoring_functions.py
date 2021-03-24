# Scoring functions for Shared Interest

import numpy as np
    
    
def iou(ground_truth_masks, explanation_regions):
    """
    Returns the intersection of ground truth and explanation / union of ground truth and explantion region
    """
    intersection = np.sum(ground_truth_masks * explanation_regions, axis=(1,2))
    union = np.sum(np.logical_or(ground_truth_masks, explanation_regions), axis=(1,2))
    return intersection / union


def recall(ground_truth_masks, explanation_regions):
    """
    Returns saliency in the ground truth region / saliency everywhere
    """
    intersection = np.sum(ground_truth_masks * explanation_regions, axis=(1,2))
    explanation_saliency = np.sum(explanation_regions, axis=(1,2))
    return intersection / explanation_saliency


def precision(ground_truth_masks, explanation_regions):
    """
    Returns the intersection of ground truth and explanation / size of the ground truth mask
    """
    intersection = np.sum(ground_truth_masks * explanation_regions, axis=(1,2))
    ground_truth_saliency = np.sum(ground_truth_masks, axis=(1,2))
    return intersection / ground_truth_saliency