# Vanilla gradients interpretability method class. 
# Derived from original papers: https://www.researchgate.net/profile/Aaron_Courville/publication/265022827_Visualizing_Higher-Layer_Features_of_a_Deep_Network/links/53ff82b00cf24c81027da530.pdf; https://arxiv.org/pdf/1312.6034.pdf

import torch
import numpy as np
from backend.server.interpretability_methods.interpretability_method import InterpretabilityMethod


class VanillaGradients(InterpretabilityMethod):
    
    def __init__(self, model):
        super().__init__(model)
        
    
    def get_masks(self, input_batch, target_classes=None):
        """Compute vanilla gradient mask using the magnitude of the gradients."""
        # Initialize gradient for the input
        input_batch.requires_grad_()
        input_batch.retain_grad()
        if input_batch.grad is not None: # Zero out existing gradients
            input_batch.grad.data.zero_()

        # Compute the gradient of the input with respect to the target class
        output = self.model(input_batch)
        if target_classes is None:
            target_classes = output.argmax(dim=1)
        score = torch.sum(output[torch.arange(output.shape[0]), target_classes])
        score.backward(retain_graph=True)
        vanilla_gradients = input_batch.grad.data
        return np.abs(vanilla_gradients.cpu().detach().numpy())
    