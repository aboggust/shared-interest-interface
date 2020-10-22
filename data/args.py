"""Arguments for data preprocssing."""
import argparse

import explanation_methods
import torchvision.models as models


def get_args():
    """Processes and sets command line arguments."""
    model_names = sorted(name for name in models.__dict__
                         if name.islower() and not name.startswith("__")
                         and callable(models.__dict__[name]))

    explanation_fns = [fn for fn in dir(explanation_methods)
                       if not fn.startswith('__')]

    parser = argparse.ArgumentParser(description='Arguments for preprocessing.')
    parser.add_argument('-a', '--arch', default='resnet50', type=str,
                        choices=model_names, help='model architecture')
    parser.add_argument('-c', '--case_study', type=str, help='case study name')
    parser.add_argument('-e', '--explanation_fn', type=str,
                        choices=explanation_fns,
                        help='explanation function name')
    parser.add_argument('-g', '--ground_truth_dir', type=str,
                        help='path to ground truth annotations')
    parser.add_argument('-i', '--image_dir', type=str,
                        help='path to image data')
    parser.add_argument('-l', '--label_map', type=str, help='path to label map')
    parser.add_argument('-m', '--model', type=str, help='model state dict')
    parser.add_argument('-n', '--num_classes', type=int,
                        help='number of classes the model will use')
    parser.add_argument('-o', '--output_dir', default='./examples', type=str,
                        help='directory to store data files')
    parser.add_argument('-p', '--pretrain', action='store_true')
    parser.add_argument('-x', '--ground_truth_xml', action='store_true')
    parser.add_argument('--in9', action='store_true')
    args = parser.parse_args()
    return args
