"""Module contains functions that extract explanation regions from an image and
a model. Additional functions can be added for additional explanation
regions."""

import numpy as np
import torch
import torch.nn.functional as F
import torchvision.transforms as transforms
from PIL import Image
from lime import lime_image


def lime(image, model):
    """Get a explanation mask of the model's decision on the image."""
    normalize = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225])
    ])

    vector_to_image = transforms.Compose([
        transforms.Lambda(lambda x: x[0]),
        transforms.Normalize(mean=[0, 0, 0], std=[4.3668, 4.4643, 4.4444]),
        transforms.Normalize(mean=[-0.485, -0.456, -0.406], std=[1, 1, 1]),
    ])

    pil_image = vector_to_image(image)
    pil_image = np.uint8(pil_image * 255)
    pil_image = Image.fromarray(pil_image.transpose(1, 2, 0))

    explainer = lime_image.LimeImageExplainer()

    def batch_predict(images):
        model.eval()
        batch = torch.stack(tuple(normalize(img) for img in images), dim=0)

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        batch = batch.to(device)

        logits = model(batch)
        probs = F.softmax(logits, dim=1)
        return probs.detach().cpu().numpy()

    explanation = explainer.explain_instance(np.array(pil_image),
                                             batch_predict,
                                             top_labels=1,
                                             hide_color=0,
                                             num_samples=1000)
    _, mask = explanation.get_image_and_mask(explanation.top_labels[0],
                                             positive_only=True, num_features=5,
                                             hide_rest=False)
    return mask
