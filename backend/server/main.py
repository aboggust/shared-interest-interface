import argparse
import pandas as pd
from typing import *
import json
import h5py
import numpy as np
import base64
from PIL import Image
from io import BytesIO
import rasterio.features
import shapely.geometry
import cv2

from time import time

from fastapi import FastAPI
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import backend.server.api as api
import backend.server.path_fixes as pf
from backend.server.util_functions import get_score_function, get_prediction_function

parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument("--port", default=8000, type=int, help="Port to run the app. ")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Main routes
@app.get("/")
def index():
    """For local development, serve the index.html in the dist folder"""
    return RedirectResponse(url="client/index.html")

# the `file_path:path` says to accept any path as a string here. Otherwise, `file_paths` containing `/` will not be served properly
@app.get("/client/{file_path:path}")
def send_static_client(file_path:str):
    """ Serves (makes accessible) all files from ./client/ to ``/client/{path}``. Used primarily for development. NGINX handles production.

    Args:
        path: Name of file in the client directory
    """
    f = str(pf.DIST / file_path)
    print("Finding file: ", f)
    return FileResponse(f)

# ======================================================================
## MAIN API ##
# ======================================================================
class SaliencyImage(BaseModel):
    image: str
    bbox: list
    saliency: list
    label: str
    prediction: str
    iou_score: str
    bbox_proportion_score: str
    saliency_proportion_score: str


# FULL
f = h5py.File("./data/output/data_dogs.hdf5", "r")
df = pd.read_json("./data/output/data_dogs.json")

# TEST
# f = h5py.File("./data/output/data_100.hdf5", "r")
# df = pd.read_json("./data/output/data_100.json")
N = len(df)

@app.get("/api/get-images", response_model=List[str])
async def get_images(sortBy: int, predictionFn: str, scoreFn: str, labelFilter: str):
    start = time()
    if predictionFn == "all_images":
        pred_inds = np.ones(N)
    elif predictionFn == "correct_only":
        pred_inds = df.label == df.prediction
    elif predictionFn == "incorrect_only":
        pred_inds = df.label != df.prediction

    # Assume predictionFn is a label
    else:
        pred_inds = df.prediction == predictionFn

    if labelFilter == '': label_inds = np.ones(N)
    else: label_inds = df.label == labelFilter

    mask = np.logical_and(pred_inds, label_inds)
    filtered_df = df.loc[mask].sort_values(scoreFn, kind="mergesort", ascending=sortBy==1)

    outnames = list(filtered_df.fname)
    print(f"\nFiltering and sorting took {time() - start} seconds\n")
    return outnames


@app.get("/api/get-a-saliency-image", response_model=SaliencyImage)
async def get_saliency_image(imageID: str, scoreFn: str):
    return _get_saliency_image(imageID, scoreFn)


@app.post("/api/get-saliency-images", response_model=List[SaliencyImage])
async def get_saliency_images(payload: api.ImagesPayload):
    start = time()
    payload = api.ImagesPayload(**payload)

    print(f"\nTrying to return {len(payload.imageIDs)} samples\n")
    filtered_df = df.loc[df.fname.isin(payload.imageIDs)]
    filtered_df['score'] = filtered_df[payload.scoreFn]

    print(f"\nGetting all saliency images took {time() - start} seconds\n")
    return filtered_df.to_dict('records')


def _get_saliency_image(image_id: str, score_fn: str):
    """Return saliency image object given image ID and score function."""
    data = f['images'][image_id]
    image = data['image'][()]
    bbox_polygons = list(data['bbox_polygons'][()])
    saliency_polygons = list(data['saliency_polygons'][()])
    features = data['feature'][()].squeeze(0).tolist()
    image_string = _image_to_string(image.transpose(1, 2, 0))

    label = data.attrs['label']
    prediction = data.attrs['prediction']
    score = data.attrs[score_fn]
    return {'image': image_string, 'bbox': bbox_polygons, 'saliency': saliency_polygons,
            'label': label, 'prediction': prediction, 'score': score, 'features': features}


def _image_to_string(array):
    """ Converts numpy array to base64 string. """
    pil_array = Image.fromarray((array * 225).astype(np.uint8))
    buff = BytesIO()
    pil_array.save(buff, format="JPEG")
    array_string = base64.b64encode(buff.getvalue()).decode("utf-8")
    return array_string


def _mask_to_polygon(mask_array):
    """ Converts boolean array mask to polygon string. """
    shapes = rasterio.features.shapes(mask_array)
    polygons = [shapely.geometry.Polygon(shape[0]["coordinates"][0]) for shape in shapes if shape[1] == 1]
    polygon_strings = [' '.join([','.join([str(c) for c in coord]) for coord in polygon.exterior.coords]) for polygon in polygons]
    return polygon_strings


def _label_filter(label_filter_string):
    """Returns function that returns true if label in label_filter_string. False otherwise."""
    if label_filter_string == '':
        return lambda label: True
    return lambda label: label == label_filter_string


if __name__ == "__main__":
    # This file is not run as __main__ in the uvicorn environment
    args, _ = parser.parse_known_args()
    uvicorn.run("server:app", host='127.0.0.1', port=args.port)
