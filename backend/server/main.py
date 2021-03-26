import argparse
import os
from typing import *
import numpy as np

import torch
import pandas as pd
from fastapi import FastAPI
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import server.api as api

import torch
from torchvision import models, transforms
from pydantic import BaseModel

from backend.server.shared_interest.shared_interest import shared_interest 
from backend.server.interpretability_methods.vanilla_gradients import VanillaGradients
from backend.server.interpretability_methods.util import binarize_masks
import backend.server.api as api
import backend.server.path_fixes as pf
from PIL import Image
from io import BytesIO
from base64 import b64decode

parser = argparse.ArgumentParser(
    formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument("--port", default=5050, type=int,
                    help="Port to run the app. ")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

prefix = os.environ.get('CLIENT_PREFIX', 'client')


# Main routes
@app.get("/demo")
def index():
    """For local development, serve the index.html in the dist folder"""
    return RedirectResponse(url=f"{prefix}/index.html")


@app.get("/")
def index():
    return RedirectResponse(url=f"{prefix}/index-distill.html")


# the `file_path:path` says to accept any path as a string here.
# Otherwise, `file_paths` containing `/` will not be served properly
@app.get("/client/{file_path:path}")
def send_static_client(file_path: str):
    """ Serves all files from ./client/ to ``/client/{path}``.
    Used primarily for development. NGINX handles production.

    Args:
        file_path: Name of file in the client directory
    """
    f = str(pf.DIST / file_path)
    print("Finding file: ", f)
    return FileResponse(f)


# ======================================================================
# MAIN API
# ======================================================================
class SaliencyImage(BaseModel):
    image: str
    bbox: list
    saliency: list
    label: str
    prediction: str
    score: str


class Bins(BaseModel):
    x0: float
    x1: float
    num: int


class ConfusionMatrix(BaseModel):
    label: str
    prediction: str
    count: int
    mean: float


# Load case study datasets
datasets = ['data_dogs', 'data_vehicle', 'data_melanoma']
dataframes = {}
for dataset in datasets:
    dataframe = pd.read_json("./data/examples/%s.json" % dataset)
    dataframes[dataset] = dataframe.set_index('fname')


@app.get("/api/get-images", response_model=List[str])
async def get_images(case_study: str, sort_by: int, prediction_fn: str,
                     score_fn: str, label_filter: str):
    """ Get images from dataset given the current filters.

    Args:
        case_study: The name of the case study dataset.
        sort_by: 1 if ascending, -1 if descending.
        prediction_fn: The prediction function. It can be 'all_images',
                       'correct_only', 'incorrect_only', or any label.
        score_fn: The score function name to apply.
        label_filter: The label filter to apply. It can be any label name or ''
                      for all labels.

    Returns:
        A list of image IDs from case_study filtered given the prediction_fn and
         label_filter and sorted by the score_fn in sort_by order.
    """
    df = dataframes[case_study]
    if prediction_fn == "all_images":
        pred_inds = np.ones(len(df))
    elif prediction_fn == "correct_only":
        pred_inds = df.label == df.prediction
    elif prediction_fn == "incorrect_only":
        pred_inds = df.label != df.prediction
    else:  # Assume predictionFn is a label
        pred_inds = df.prediction == prediction_fn

    if label_filter == '':
        label_inds = np.ones(len(df))
    else:
        label_inds = df.label == label_filter

    mask = np.logical_and(pred_inds, label_inds)
    filtered_df = df.loc[mask].sort_values(score_fn, kind="mergesort",
                                           ascending=sort_by == 1)
    image_ids = list(filtered_df.index)
    return image_ids


@app.get("/api/get-saliency-image", response_model=SaliencyImage)
async def get_saliency_image(case_study: str, image_id: str, score_fn: str):
    """Gets a single saliency image.

    Args:
        case_study: The name of the case study dataset.
        image_id: The id of the image to return.
        score_fn: The score function to return.

    Returns:
        A dictionary of the image data for image_id from case_study. The 'score'
         key is set to the score_fn value.
    """
    df = dataframes[case_study]
    filtered_df = df.loc[image_id]
    filtered_df['score'] = filtered_df[score_fn]
    return filtered_df.to_dict()


@app.post("/api/get-saliency-images", response_model=List[SaliencyImage])
async def get_saliency_images(payload: api.ImagesPayload):
    """Gets saliency images.

        Args:
            payload: The payload containing the name of the case study, image
                     IDs, and the score function.

        Returns:
            A dictionary of the image data for the image IDs and case study in
            the payload. The 'score' key is the value of the score function in
            the payload.
        """
    payload = api.ImagesPayload(**payload)
    df = dataframes[payload.case_study]
    filtered_df = df.loc[payload.image_ids]
    filtered_df['score'] = filtered_df[payload.score_fn]
    return filtered_df.to_dict('records')


@app.get("/api/get-labels", response_model=List[str])
async def get_labels(case_study: str):
    """Gets the label values given the case study."""
    df = dataframes[case_study]
    return list(df.label.unique())


@app.get("/api/get-predictions", response_model=List[str])
async def get_predictions(case_study: str):
    """Gets the possible prediction values given the case study."""
    df = dataframes[case_study]
    return list(df.prediction.unique())


@app.post("/api/bin-scores", response_model=List[Bins])
async def bin_scores(payload: api.ImagesPayload, min_range: int = 0,
                     max_range: int = 1, num_bins: int = 11):
    """Bins the scores of the images.

    Args:
        payload: The payload containing the case study, images, and score fn.
        min_range: The start of the bin range, inclusive. Defaults to 0.
        max_range: The end of the bin range, inclusive. Defaults to 1.
        num_bins: The number of bins to create. Defaults to 11.

    Returns:
        A list of dictionary objects containing the start, end, and number of
        scores in each bin.
    """
    payload = api.ImagesPayload(**payload)
    df = dataframes[payload.case_study]
    filtered_df = df.loc[payload.image_ids]
    scores = filtered_df[payload.score_fn].tolist()
    bins = np.linspace(min_range, max_range, num_bins)
    hist, bin_edges = np.histogram(scores, bins)
    bin_object = [{'x0': bin_edges[i], 'x1': bin_edges[i + 1], 'num': num}
                  for i, num in enumerate(list(hist))]
    return bin_object


@app.get("/api/confusion-matrix", response_model=List[ConfusionMatrix])
async def get_confusion_matrix_values(case_study: str, label_filter: str,
                                      score_fn: str, n: int = 10):
    """Gets the values of the confusion matrix.

    Args:
        case_study: The name of the case study dataset.
        label_filter: The label filter to apply. It can be any label name or ''
                      for all labels.
        score_fn: The score function to return.
        n: The nxn size of the confusion matrix.

    Returns:
        The confusion matrix of the top n confused labels.
    """
    df = dataframes[case_study]
    if label_filter == '':
        filtered_df = df.loc[df.label != df.prediction]
    else:
        filtered_df = df.loc[
            (df.label == label_filter) & (df.label != df.prediction)]
    confused_labels = filtered_df.groupby('label').agg('count') \
                          .sort_values('image',
                                       ascending=False).index.values.tolist()[
                      :n]
    top_predictions = df.loc[df.label.isin(confused_labels)].groupby(
        'prediction').agg('count') \
                          .sort_values('image',
                                       ascending=False).index.values.tolist()[
                      :n]
    matrix_labels = list(set(top_predictions + confused_labels))
    confusion_df = df.loc[
        (df.label.isin(matrix_labels)) & (df.prediction.isin(matrix_labels))]
    confusion_matrix = confusion_df.groupby(['label', 'prediction']) \
        .agg(['count', 'mean'])[score_fn] \
        .reset_index().to_dict('records')
    return confusion_matrix


# ======================================================================
## Best Prediction API ##
# ======================================================================

class PredictionResponse(BaseModel):
    classname: str
    score: float
    saliency_mask: List[List[int]]

def _load_model_from_pytorch(architecture, pretrained):
    """Load model of type architecture from pytorch. Model is pretrained if pretrained."""
    model = models.__dict__[architecture](pretrained=pretrained)
    if torch.cuda.device_count() > 1:
        model = nn.DataParallel(model)
    return model   

# # ImageNet Constants
# NUM_CLASSES = 1000
NUM_CLASSES = 5
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL = _load_model_from_pytorch('resnet50', True).to(DEVICE).eval()
TRANSFORM = transforms.Compose([transforms.ToTensor(),
                                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])])

# Saliency method
SALIENCY_FN = VanillaGradients(MODEL).get_masks

def bytes2np(img_bytes):
    """Convert image bytes from frontend to numpy array"""
    im = Image.open(BytesIO(b64decode(img_bytes))).convert("RGB")
    return np.array(im)

@app.post("/api/get-best-prediction", response_model=List[PredictionResponse])
async def get_best_prediction(payload:api.BestPredictionPayload):
    """Returns topk labels and saliency maps with the highest si_method score.
    
    Assumes image and mask are of shape (224,224, 4) [rgba]. The mask is processed here to be (224,224)
    """

    image = payload['image']
    mask = payload['mask']
    si_method = payload['si_method']
    topk = payload['topk']

    image = bytes2np(image)
    mask = (bytes2np(mask).sum(axis=-1) > 0)

    if (image.shape[0], image.shape[1]) != mask.shape:
        raise ValueError('Image and mask are not the same size.')

    # Convert numpy arrays to tensor and include batch dimension.
    mask = transforms.ToTensor()(mask)
    if len(mask.shape) == 2:
        mask.unsqueeze(0)

    image = TRANSFORM(image).float().to(DEVICE)
    if len(image.shape) == 3:
        image = image.unsqueeze(0)

    # Batch saliency map call by repeating the image for each class.
    input_batch = image.repeat(NUM_CLASSES, 1, 1, 1)
    target_classes = list(range(NUM_CLASSES))

    # Get saliency maps for the input against all classes.
    saliency_maps = SALIENCY_FN(input_batch, target_classes=target_classes)
    saliency_masks = binarize_masks(np.expand_dims(np.sum(saliency_maps, axis=1), axis=1)).squeeze(1)

    # Compute shared interest scores.
    mask_batch = mask.repeat(NUM_CLASSES, 1, 1).numpy()
    shared_interest_scores = shared_interest(mask_batch, saliency_masks, score=si_method)

    # Return topk saliency maps and scores.
    max_inds = np.argpartition(shared_interest_scores, -topk)[-topk:]
    max_inds_sorted = max_inds[np.argsort(-shared_interest_scores[max_inds])]
    top_scores = shared_interest_scores[max_inds_sorted]
    top_saliency_masks = saliency_masks[max_inds_sorted]

    classlist = "The great big dog jumped over a crowded building".split(" ")
    output = []
    for score, m, cname in zip(list(top_scores), top_saliency_masks.tolist(), classlist[:topk]):
        output.append(PredictionResponse(**{
            "classname": cname,
            "score": score,
            "saliency_mask": m
        }))

    return output


if __name__ == "__main__":
    # This file is not run as __main__ in the uvicorn environment
    args, _ = parser.parse_known_args()
    uvicorn.run("server:app", host='127.0.0.1', port=args.port)
