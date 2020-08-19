# Datasets for ImageNet.

import os
import torch
from PIL import Image
from torchvision.datasets import ImageFolder
import xml.etree.ElementTree as ET


class ImageBoundingBoxFolder(ImageFolder):
    """ImageFolder dataset with bounding box data."""

    def __init__(self, image_root, bbox_root, transform=None, bbox_transform=None):
        super().__init__(image_root, transform=transform)
        self.bbox_root = bbox_root
        self.bbox_transform = bbox_transform


    def __len__(self, ):
        return super().__len__()


    def __getitem__(self, index):
        """Returns the image, the target label, and the bounding box mask."""
        image, target = super().__getitem__(index)
        image_path, _ = self.imgs[index]
        image_width, image_height = Image.open(image_path).size

        self.image_name = image_path.strip().split('/')[-1].split('.')[0]
        n_id, _ = self.image_name.split('_')
        self.bbox_path = os.path.join(self.bbox_root, n_id, '%s.xml' %(self.image_name))
        bbox_mask = self._get_bbox_mask(self.bbox_path, image_height, image_width)
        bbox_mask = self.bbox_transform(bbox_mask).squeeze(0)
        return image, bbox_mask, self.image_name


    def _get_bbox_mask(self, bbox_path, img_height, img_width):
        """Returns a mask the same size as the image with 1s for pixels in
        bounding boxes and 0 elsewhere."""
        try:
            coords = self._parse_bbox_xml(bbox_path)
            mask = torch.zeros((img_height, img_width))
            for coord in coords:
                mask[coord['ymin']:coord['ymax'], coord['xmin']:coord['xmax']] = 1
        except IOError as e:
            # Image does not have bounding box data, so return a mask of all ones.
            # This will not penalize the loss function.
            mask = torch.ones((img_height, img_width))
        return mask


    def _parse_bbox_xml(self, bbox_path):
        """Parse ImageNet formated bounding box XML file."""
        if not os.path.isfile(bbox_path):
            raise IOError('No bounding box data for %s' %(self.image_name))
        tree = ET.parse(bbox_path)
        root = tree.getroot()
        bboxes = [obj.find('bndbox') for obj in root.findall('object')]
        coords = [{'xmin': int(bbox.find('xmin').text),
                   'ymin': int(bbox.find('ymin').text),
                   'xmax': int(bbox.find('xmax').text),
                   'ymax': int(bbox.find('ymax').text), } for bbox in bboxes]
        return coords
