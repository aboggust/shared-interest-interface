import os
import torch
import json
import h5py
from tqdm import tqdm
import numpy as np
from args import get_args
import cv2
import nltk
from nltk.corpus import wordnet
import torchvision.models as models
import torchvision.transforms as transforms
from datasets import ImageBoundingBoxFolder
from saliency_methods import compute_lime_mask
import rasterio.features
import shapely.geometry
import base64
from PIL import Image
from io import BytesIO


def main():
    args = get_args()
    image_directory = os.path.join(args.imagedir, args.imagesplit)
    with open(args.labelmap, 'r') as f:
        label_map = json.load(f)

    with h5py.File(os.path.join(args.outputdir, 'data_%s.hdf5' %(args.casestudy)), 'w') as hdf5_file:
        images_group = hdf5_file.create_group('images')

        # Load pretrained model and create data loaders
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        if args.pretrain:
            model = models.__dict__[args.arch](pretrained=True)
        else:
            model = models.__dict__[args.arch](pretrained=False, num_classes=2)
            model.load_state_dict(torch.load(args.model))
            
        model.to(device).eval()

        image_to_vector_transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225]),
            ])

        bbox_transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor()
        ])

        vector_to_image_transform = transforms.Compose([
            transforms.Lambda(lambda x: x[0]),
            transforms.Normalize(mean=[0, 0, 0], std=[4.3668, 4.4643, 4.4444]),
            transforms.Normalize(mean=[-0.485, -0.456, -0.406], std=[1, 1, 1]),
        ])
        
        dataset = ImageBoundingBoxFolder(image_directory,
                                         args.bboxdir,
                                         image_to_vector_transform,
                                         bbox_transform,
                                         args.bboxxml,)

        # Get bbox LIME mask, score, and prediction for each image
        for i, (image, bbox_mask, image_name) in enumerate(tqdm(dataset)):
            if args.casestudy == 'imagenet':
                nid = image_name.split('_')[0]
                label = wordnet.synset_from_pos_and_offset(nid[0], int(nid[1:])).name().split('.')[0]
            else:
                label = dataset.imgs[i][0].split('/')[-2]
            bbox_mask = bbox_mask.numpy().astype('uint8')
            lime_mask = compute_lime_mask(image.unsqueeze(0), model).astype('uint8')
            outputs = model(image.unsqueeze(0).to(device))
            prediction = label_map[str(int(outputs.argmax(dim=1)))]
            if args.casestudy == 'imagenet':
                prediction = prediction[1].lower()
            
            image = vector_to_image_transform(image.unsqueeze(0)).numpy()
            image_string = _image_to_string(image.transpose(1, 2, 0))

            bbox_polygons = _mask_to_polygon(cv2.resize(bbox_mask, dsize=(175, 175), interpolation=cv2.INTER_CUBIC))
            saliency_polygons = _mask_to_polygon(cv2.resize(lime_mask, dsize=(175, 175), interpolation=cv2.INTER_CUBIC))
            scores = _get_scores(bbox_mask, lime_mask)

            image_group = images_group.create_group(image_name)
            image_group.create_dataset('image', data=image_string)
            image_group.create_dataset('bbox_polygons', data=np.array(bbox_polygons, dtype='S'))
            image_group.create_dataset('saliency_polygons', data=np.array(saliency_polygons, dtype='S'))
            image_group.attrs['label'] = label
            image_group.attrs['prediction'] = prediction
            for score_key, score in scores.items():
                image_group.attrs[score_key] = score


def _mask_to_polygon(mask_array):
    """ Converts boolean array mask to polygon string. """
    shapes = rasterio.features.shapes(mask_array)
    polygons = [shapely.geometry.Polygon(shape[0]["coordinates"][0]) for shape in shapes if shape[1] == 1]
    polygon_strings = [' '.join([','.join([str(c) for c in coord]) for coord in polygon.exterior.coords]) for polygon in polygons]
    return polygon_strings


def _get_scores(bbox, saliency):
    def saliency_proportion_score(bbox_mask, saliency_mask):
        """Proportion of saliency that overlaps with the bounding box."""
        return float(np.sum(bbox_mask & saliency_mask) / np.sum(saliency_mask))

    def bbox_proportion_score(bbox_mask, saliency_mask):
        """Proportion of bounding box that overlaps with the saliency."""
        return float(np.sum(bbox_mask & saliency_mask) / np.sum(bbox_mask))

    def iou_score(bbox_mask, saliency_mask):
        """Intersection over union of bounding box and saliency."""
        return float(np.sum(bbox_mask & saliency_mask) / np.sum(bbox_mask | saliency_mask))

    return {'saliency_proportion_score': saliency_proportion_score(bbox, saliency),
            'bbox_proportion_score': bbox_proportion_score(bbox, saliency),
            'iou_score': iou_score(bbox, saliency)}


def _image_to_string(array):
    """ Converts numpy array to base64 string. """
    pil_array = Image.fromarray((array * 225).astype(np.uint8))
    buff = BytesIO()
    pil_array.save(buff, format="JPEG")
    array_string = base64.b64encode(buff.getvalue()).decode("utf-8")
    return array_string


if __name__ == '__main__':
    main()