import os
import torch
import json
import h5py
from tqdm import tqdm
import numpy as np
from args import get_args
import nltk
from nltk.corpus import wordnet
import torchvision.models as models
import torchvision.transforms as transforms
from datasets import ImageBoundingBoxFolder
from saliency_methods import compute_lime_mask


def main():
    args = get_args()
    image_directory = os.path.join(args.imagedir, args.imagesplit)
    with open(args.labelmap, 'r') as f:
        label_map = json.load(f)

    with h5py.File(os.path.join(args.outputdir, 'data.hdf5'), 'w') as hdf5_file:
        images_group = hdf5_file.create_group('images')

        # Load pretrained model and create data loaders
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = models.__dict__[args.arch](pretrained=True).to(device).eval()

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
                                         bbox_transform)

        # Get bbox LIME mask, score, and prediction for each image
        for i, (image, bbox_mask, image_name) in enumerate(tqdm(dataset)):
            nid = image_name.split('_')[0]
            label = wordnet.synset_from_pos_and_offset(nid[0], int(nid[1:])).name().split('.')[0]
            bbox_mask = bbox_mask.numpy().astype('uint8')
            lime_mask = compute_lime_mask(image.unsqueeze(0), model).astype('uint8')
            score = float(np.sum(bbox_mask & lime_mask) / np.sum(lime_mask))
            outputs = model(image.unsqueeze(0).to(device))
            feature = outputs.data.cpu().numpy()
            prediction = label_map[str(int(outputs.argmax(dim=1)))][1].lower()
            image = vector_to_image_transform(image.unsqueeze(0)).numpy()

            image_group = images_group.create_group(image_name)
            image_group.create_dataset('image', data=image)
            image_group.create_dataset('bbox', data=bbox_mask)
            image_group.create_dataset('saliency', data=lime_mask)
            image_group.create_dataset('feature', data=feature)
            image_group.attrs['label'] = label
            image_group.attrs['score'] = score
            image_group.attrs['prediction'] = prediction

        image_names = sorted(list(images_group.keys()), key=lambda name: images_group[name].attrs['score'])

    with open(os.path.join(args.outputdir, 'image_names.json'), 'w') as image_name_file:
        json.dump(image_names, image_name_file)


if __name__ == '__main__':
    main()