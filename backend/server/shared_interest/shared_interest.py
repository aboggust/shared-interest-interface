# Shared interest method.

import inspect
import logging
import numpy as np

from backend.server.shared_interest import _scoring_functions


def shared_interest(ground_truth_masks, explanation_regions, score='iou'):
    """
    Computes the Shared Interest score for the given ground truth and explanation regions.

    Args:
    ground_truth_masks: A (instances, height, width) numpy array containing a batch of masks.
        Mask must contain 1s in the ground truth regions and 0s elsewhere.
    explanation_regions: A (instances, height, width) numpy array containing a batch of explanation regions.
        If explanation_regions contains all integers, scoring will be computing using the discrete metric,
        otherwise, continuous scoring will be used.
    score: One of 'iou', 'recall', or 'precision' indicating which scoring function to use.
    
    Raises:
        ValueError if score is not a valid scoring function.
        ValueError if explanation region is discrete but contains values other than 0 or 1.
        ValueError if the explanation region is discrete, but a score other than recall is used.

    Returns:
    A numpy array of size (instances) of floating point shared interest scores.
    """
    # Get the scoring function from score input.
    score_functions = {name: function for name, function in inspect.getmembers(_scoring_functions, inspect.isfunction)}
    if '%s' %(score) not in score_functions.keys():
        raise ValueError('%s is not a valid scoring function.' %(score))
    score_function = score_functions[score]
    
    # Check whether discrete or continuous scoring will be used.
    discrete = np.issubdtype(explanation_regions.dtype, np.integer)
    if not discrete and score != 'recall':
        raise ValueError('Continuous explanations can only use recall score.')
    if discrete and not np.isin(explanation_regions, [0, 1]).all():
        raise ValueError('Explanation region is discrete, but contains non 0, 1 values.')
    logging.info('Explanation region is being treated as %s since dtype is %s.'
                %('discrete' if discrete else 'continuous', explanation_regions.dtype))
    
    # Compute the shared interest score.
    score = score_function(ground_truth_masks, np.abs(explanation_regions))
    return score
        