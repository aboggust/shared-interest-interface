import numpy as np


def get_score_function(score_fn):
    """Get the score function given string function name."""
    def saliency_proportion_score(bbox_mask, saliency_mask):
        """Proportion of saliency that overlaps with the bounding box."""
        return float(np.sum(bbox_mask & saliency_mask) / np.sum(saliency_mask))

    def bbox_proportion_score(bbox_mask, saliency_mask):
        """Proportion of bounding box that overlaps with the saliency."""
        return float(np.sum(bbox_mask & saliency_mask) / np.sum(bbox_mask))

    def iou_score(bbox_mask, saliency_mask):
        """Intersection over union of bounding box and saliency."""
        return float(np.sum(bbox_mask & saliency_mask) / np.sum(bbox_mask | saliency_mask))

    return locals()[score_fn]


def get_prediction_function(prediction_fn):
    """Get prediction function from prediction function name."""

    def all_images(label, prediction):
        return True

    def correct_only(label, prediction):
        return label == prediction

    def incorrect_only(label, prediction):
        return label != prediction

    if prediction_fn in locals():
        return locals()[prediction_fn]

    return lambda label, prediction: prediction == prediction_fn
