import argparse
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
    score: str
    features: list


f = h5py.File("./data/output/data_100.hdf5", "r")

@app.get("/api/get-images", response_model=List[str])
async def get_images(sortBy: int, predictionFn: str, scoreFn: str, labelFilter: str):
    prediction_fn = get_prediction_function(predictionFn)
    score_fn = get_score_function(scoreFn)
    label_filter_fn = _label_filter(labelFilter)
    data = f['images']
    image_names = list(data.keys())
    image_names = [name for name in image_names
                   if label_filter_fn(data[name].attrs['label']) and
                   prediction_fn(data[name].attrs['label'], data[name].attrs['prediction'])]
    image_names.sort(key=lambda name: score_fn(data[name]['bbox'][()], data[name]['saliency'][()]) , reverse=sortBy==-1)
    return image_names


@app.get("/api/get-a-saliency-image", response_model=SaliencyImage)
async def get_saliency_image(imageID: str, scoreFn: str):
    data = f['images'][imageID]
    image = data['image'][()]
    bbox = data['bbox'][()]
    bbox_polygons = _mask_to_polygon(cv2.resize(bbox, dsize=(175, 175), interpolation=cv2.INTER_CUBIC))
    saliency = data['saliency'][()]
    saliency_polygons = _mask_to_polygon(cv2.resize(saliency, dsize=(175, 175), interpolation=cv2.INTER_CUBIC))
    features = data['feature'][()].squeeze(0).tolist()
    image_string = _image_to_string(image.transpose(1, 2, 0))

    label = data.attrs['label']
    prediction = data.attrs['prediction']
    score = get_score_function(scoreFn)(bbox, saliency)
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
