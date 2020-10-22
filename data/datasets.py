"""Dataset for images with ground truth annotations."""

import os
import xml.etree.ElementTree as ET

import numpy as np
import torch
from PIL import Image
from torchvision.datasets import ImageFolder


class AnnotatedImageFolder(ImageFolder):
    """ImageFolder dataset with additional ground truth region data."""

    def __init__(self, image_root, ground_truth_root, transform=None,
                 ground_truth_transform=None, ground_truth_is_xml=True):
        super().__init__(image_root, transform=transform)
        self.ground_truth_root = ground_truth_root
        self.ground_truth_transform = ground_truth_transform
        self.ground_truth_is_xml = ground_truth_is_xml

    def __len__(self, ):
        return super().__len__()

    def __getitem__(self, index):
        """Returns the image, the ground truth mask, and the image name."""
        image, _ = super().__getitem__(index)
        image_path, _ = self.imgs[index]
        image_width, image_height = Image.open(image_path).size

        image_name = image_path.strip().split('/')[-1].split('.')[0]
        if self.ground_truth_is_xml:
            n_id, _ = image_name.split('_')
            ground_truth_path = os.path.join(self.ground_truth_root,
                                             n_id,
                                             '%s.xml' % image_name)
        else:
            ground_truth_path = os.path.join(self.ground_truth_root,
                                             '%s_Segmentation.png' % (
                                                 image_name))
        ground_truth_mask = self._get_ground_truth_mask(ground_truth_path,
                                                        image_height,
                                                        image_width)
        ground_truth_mask = self.ground_truth_transform(
            ground_truth_mask).squeeze(0)
        return image, ground_truth_mask, image_name

    def _get_ground_truth_mask(self, ground_truth_path, img_height, img_width):
        """Returns a mask the same size as the image with 1s for pixels in the
        ground truth region and 0 elsewhere."""
        try:
            if self.ground_truth_is_xml:
                coords = _parse_ground_truth_xml(ground_truth_path)
                mask = torch.zeros((img_height, img_width))
                for coord in coords:
                    mask[coord['ymin']:coord['ymax'],
                    coord['xmin']:coord['xmax']] = 1
            else:
                mask = np.array(Image.open(ground_truth_path))
        except IOError as e:
            # Image doesn't have bounding box data, so return a mask of all 1s.
            mask = torch.ones((img_height, img_width))
        return mask


def _parse_ground_truth_xml(ground_truth_path):
    """Parse ImageNet formatted bounding box XML file."""
    if not os.path.isfile(ground_truth_path):
        raise IOError('No bounding box data')
    tree = ET.parse(ground_truth_path)
    root = tree.getroot()
    regions = [obj.find('bndbox') for obj in root.findall('object')]
    coords = [{'xmin': int(region.find('xmin').text),
               'ymin': int(region.find('ymin').text),
               'xmax': int(region.find('xmax').text),
               'ymax': int(region.find('ymax').text), } for region in
              regions]
    return coords
