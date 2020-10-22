""" This script processes the dataset to create a data file of images,
explanations, and ground truth regions that can be consumed by shared interest.
"""
import base64
import json
import os
from io import BytesIO

import cv2
import explanation_methods
import nltk
nltk.download('wordnet')
import numpy as np
import rasterio.features
import shapely.geometry
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
from args import get_args
from datasets import AnnotatedImageFolder
from nltk.corpus import wordnet
from tqdm import tqdm


def main():
    """Create a dataset json file to be consumed by shared interest UI."""
    args = get_args()
    with open(args.label_map, 'r') as f:
        label_map = json.load(f)

    # Load the model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    if args.pretrain:
        model = models.__dict__[args.arch](pretrained=True)
    else:
        model = models.__dict__[args.arch](pretrained=False,
                                           num_classes=args.num_classes)
        model.load_state_dict(torch.load(args.model))
    model.to(device).eval()

    # Load the dataset. Update transformations if new datasets are used.
    image_to_vector = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])

    bbox_to_vector = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor()
    ])

    vector_to_image = transforms.Compose([
        transforms.Lambda(lambda x: x[0]),
        transforms.Normalize(mean=[0, 0, 0], std=[4.3668, 4.4643, 4.4444]),
        transforms.Normalize(mean=[-0.485, -0.456, -0.406], std=[1, 1, 1]),
    ])

    dataset = AnnotatedImageFolder(args.image_dir,
                                   args.ground_truth_dir,
                                   image_to_vector,
                                   bbox_to_vector,
                                   args.ground_truth_xml)

    # Process the data
    data = {'fname': {},
            'image': {},
            'bbox': {},
            'saliency': {},
            'label': {},
            'prediction': {},
            'ground_truth_coverage': {},
            'explanation_coverage': {},
            'iou': {}}

    for i, (image, ground_truth_mask, image_name) in enumerate(tqdm(dataset)):
        if args.in9:  # Use imagenet label for imagenet9 data.
            label = _get_imagenet_label(image_name)
        else:  # Otherwise use label from ImageFolder dataset.
            label = dataset.imgs[i][0].split('/')[-2]
        data['label'][i] = label

        data['fname'][i] = image_name
        data['image'][i] = _image_to_string(
            vector_to_image(image.unsqueeze(0)).numpy())

        ground_truth_mask = ground_truth_mask.numpy().astype('uint8')
        data['bbox'][i] = _mask_to_polygon(_resize_image(ground_truth_mask))

        explanation_fn = getattr(explanation_methods, args.explanation_fn)
        explanation_mask = explanation_fn(image.unsqueeze(0), model)
        explanation_mask = explanation_mask.astype('uint8')
        data['saliency'][i] = _mask_to_polygon(_resize_image(explanation_mask))

        scores = _get_scores(ground_truth_mask, explanation_mask)
        for score_key, score in scores.items():
            data[score_key][i] = score

        outputs = model(image.unsqueeze(0).to(device))
        prediction = label_map[str(int(outputs.argmax(dim=1)))]
        data['prediction'][i] = prediction

    # Write data to disk
    output_file = os.path.join(args.output_dir, 'data_%s.json' % args.case_study)
    with open(output_file, 'w') as f:
        json.dump(data, f)


def _mask_to_polygon(mask_array):
    """ Converts boolean array mask to polygon string. """
    shapes = rasterio.features.shapes(mask_array)
    polygons = [shapely.geometry.Polygon(shape[0]["coordinates"][0])
                for shape in shapes if shape[1] == 1]
    polygon_strings = [' '.join([','.join([str(c) for c in coord])
                                 for coord in polygon.exterior.coords])
                       for polygon in polygons]
    return polygon_strings


def _get_scores(ground_truth, explanation):
    def explanation_coverage(ground_truth_mask, explanation_mask):
        """Proportion of explanation that overlaps with the ground truth ."""
        return float(np.sum(ground_truth_mask & explanation_mask) / np.sum(
            explanation_mask))

    def ground_truth_coverage(ground_truth_mask, explanation_mask):
        """Proportion of ground truth that overlaps with the explanation."""
        return float(np.sum(ground_truth_mask & explanation_mask) / np.sum(
            ground_truth_mask))

    def iou(ground_truth_mask, explanation_mask):
        """Intersection over union of the ground truth and explanation."""
        intersection = np.sum(ground_truth_mask & explanation_mask)
        union = np.sum(ground_truth_mask | explanation_mask)
        return float(intersection / union)

    return {
        'explanation_coverage': explanation_coverage(ground_truth, explanation),
        'ground_truth_coverage': ground_truth_coverage(ground_truth,
                                                       explanation),
        'iou': iou(ground_truth, explanation)}


def _image_to_string(array):
    """ Converts numpy array to base64 string. """
    array = (array * 225).astype(np.uint8).transpose(1, 2, 0)
    pil_array = Image.fromarray(array)
    buff = BytesIO()
    pil_array.save(buff, format="JPEG")
    array_string = base64.b64encode(buff.getvalue()).decode("utf-8")
    return array_string


def _get_imagenet_label(image_name):
    """Return the ImageNet label from the image_name."""
    nid = image_name.split('_')[0]
    pos, offset = nid[0], int(nid[1:])
    label = wordnet.synset_from_pos_and_offset(pos, offset).name().split('.')[0]
    return label


def _resize_image(image, output_size=(175, 175)):
    return cv2.resize(image, dsize=output_size, interpolation=cv2.INTER_CUBIC)


if __name__ == '__main__':
    main()
