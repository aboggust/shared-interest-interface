# Parent class for all interpretability methods

from abc import ABC, abstractmethod
import numpy as np
import torch


class InterpretabilityMethod(ABC):
    """Base class for all interpretability methods."""
    
    def __init__(self, model):
        """ TODO """
        self.model = model

    
    @abstractmethod
    def get_masks(self, input_batch, target_classes=None):
        """
        Returns mask of activations for the given input.
        
        Args:
        input_batch: inputs as torch array of dimension (batch, channel, height, width) to run
            interpretability method on.
        target_classes: None or list of integers indicating the target class for each input.
            If None, then the predicted classes are used as the target classes.
        
        Returns:
        A numpy array the same shape as the input_batch of interpretability activations with respect
        to the target classes. Output is not normalized or in absolute values.
        """
        pass
    
    
    def get_smoothgrad_masks(self, input_batch, target_classes=None, std_spread=.15, num_samples=25, magnitude=True):
        """
        Returns a mask of smoothgrad activations for the given input.
        
        Args:
        input_batch: inputs as torch array of dimension (batch, channel, height, width) to run
            interpretability method on.
        target_classes: None or list of integers indicating the target class for each input.
            If None, then the predicted classes are used as the target classes.
        std_spread: amount of noise to add to the input, as fraction of the total spread.
        num_samples: number of samples to average across to get the smooth gradient.
        magnitude: boolean representing whether to compute sum of squares.
        
        Returns:
        A numpy array the same shape as input_batch of smoothgrad interpretability activations with respect
        to the target classes. Output is not normalized or in absolute values.
        
        """
        std = float(std_spread * (torch.max(input_batch) - torch.min(input_batch)))
        total_gradients = np.zeros(input_batch.shape)
        for i in range(num_samples):
            noise = torch.empty(input_batch.shape).normal_(mean=0, std=std).to(self.device)
            noisy_input_batch = input_batch + noise
            gradients = self.get_masks(noisy_input_batch, target_classes=target_classes)
            if magnitude:
                total_gradients += (gradients * gradients)
            else:
                total_gradients += gradients
        return total_gradients / num_samples
