# Utility functions for the interpretability methods.

import numpy as np


def normalize_0to1(batch):
    """
    Normalize a batch of matrices such that every value is in the range 0 to 1.
    
    Args:
        batch: a batch first numpy array to be normalized.
        
    Returns:
        A numpy array of the same size as batch, where each matrix in the batch has
        0 <= value <= 1.
    """
    axis = tuple(range(1, len(batch.shape)))
    minimum = np.min(batch, axis=axis).reshape((-1,) + (1,) * len(axis))
    maximum = np.max(batch, axis=axis).reshape((-1,) + (1,) * len(axis))
    return (batch - minimum) / (maximum - minimum)


def binarize_masks(batch):
    """
    Creates binary mask by thresholding at one standard deviation above the mean.

    Args:
    batch: 4D numpy array (batch, channels, height, width).
    threshold: float in range 0 to 1. Values above the threshold are set to 1.
        Values below the threshold are set to 0.

    Returns:
    A 4D numpy array with dtype uint8 with all values set to 0 or 1.
    """
    batch_size = batch.shape[0]
    batch_normalized = normalize_0to1(batch)
    mean = np.mean(batch_normalized, axis=(1, 2, 3)).reshape(batch_size, 1, 1, 1)
    std = np.std(batch_normalized, axis=(1, 2, 3)).reshape(batch_size, 1, 1, 1)
    threshold = mean + std
    binary_mask = (batch_normalized >= threshold).astype('uint8')
    return binary_mask