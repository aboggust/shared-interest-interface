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
    score: str


# Load in data
f = h5py.File("./data/output/data_dogs.hdf5", "r")
df = pd.read_json("./data/output/data_dogs.json").set_index('fname')
N = len(df)


@app.get("/api/get-images", response_model=List[str])
async def get_images(sortBy: int, predictionFn: str, scoreFn: str, labelFilter: str):
    if predictionFn == "all_images":
        pred_inds = np.ones(N)
    elif predictionFn == "correct_only":
        pred_inds = df.label == df.prediction
    elif predictionFn == "incorrect_only":
        pred_inds = df.label != df.prediction
    else:  # Assume predictionFn is a label
        pred_inds = df.prediction == predictionFn

    if labelFilter == '':
        label_inds = np.ones(N)
    else:
        label_inds = df.label == labelFilter

    mask = np.logical_and(pred_inds, label_inds)
    filtered_df = df.loc[mask].sort_values(scoreFn, kind="mergesort", ascending=sortBy==1)
    outnames = list(filtered_df.index)
    return outnames


@app.post("/api/get-saliency-images", response_model=List[SaliencyImage])
async def get_saliency_images(payload: api.ImagesPayload):
    payload = api.ImagesPayload(**payload)
    filtered_df = df.loc[payload.imageIDs]
    filtered_df['score'] = filtered_df[payload.scoreFn]
    return filtered_df.to_dict('records')


if __name__ == "__main__":
    # This file is not run as __main__ in the uvicorn environment
    args, _ = parser.parse_known_args()
    uvicorn.run("server:app", host='127.0.0.1', port=args.port)
