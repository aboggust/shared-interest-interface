import argparse
import torchvision.models as models

def get_args():
    model_names = sorted(name for name in models.__dict__
                         if name.islower() and not name.startswith("__")
                         and callable(models.__dict__[name]))

    parser = argparse.ArgumentParser(description='Arguments for data proprocessing.')
    parser.add_argument('-a', '--arch', default='resnet50', type=str, choices=model_names, help='model architecture')
    parser.add_argument('-i', '--imagedir', default='./imagenet9/images', type=str, help='path to image data')
    parser.add_argument('-b', '--bboxdir', default='./imagenet9/annotations', type=str, help='path to bbox annotations')
    parser.add_argument('-s', '--imagesplit', default='example', type=str, help='dataset split to get from imagedir')
    parser.add_argument('-l', '--labelmap', default='./imagenet9/label_map.json', type=str, help='path to label map')
    parser.add_argument('-o', '--outputdir', default='./output', type=str, help='directory to store output files')
    parser.add_argument('-p', '--pretrain', action='store_true')
    parser.add_argument('-m', '--model', default='/home/aboggust/melanoma_classification/vgg11_melanoma_model.pth', type=str, help='model state dict')
    parser.add_argument('-x', '--bboxxml', action='store_true')
    parser.add_argument('-c', '--casestudy', default='imagenet')
    args = parser.parse_args()
    return args