import argparse
import pandas as pd
from typing import *
import h5py
import numpy as np

from fastapi import FastAPI
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import backend.server.api as api
import backend.server.path_fixes as pf


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


# the `file_path:path` says to accept any path as a string here.
# Otherwise, `file_paths` containing `/` will not be served properly
@app.get("/client/{file_path:path}")
def send_static_client(file_path: str):
    """ Serves (makes accessible) all files from ./client/ to ``/client/{path}``. Used primarily for development. NGINX handles production.

    Args:
        path: Name of file in the client directory
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


# Load in data
df = pd.read_json("./data/output/data_vehicle.json").set_index('fname')
N = len(df)


@app.get("/api/get-images", response_model=List[str])
async def get_images(sort_by: int, prediction_fn: str, score_fn: str, label_filter: str):
    if prediction_fn == "all_images":
        pred_inds = np.ones(N)
    elif prediction_fn == "correct_only":
        pred_inds = df.label == df.prediction
    elif prediction_fn == "incorrect_only":
        pred_inds = df.label != df.prediction
    else:  # Assume predictionFn is a label
        pred_inds = df.prediction == prediction_fn

    if label_filter == '':
        label_inds = np.ones(N)
    else:
        label_inds = df.label == label_filter

    mask = np.logical_and(pred_inds, label_inds)
    filtered_df = df.loc[mask].sort_values(score_fn, kind="mergesort", ascending=sort_by==1)
    fnames = list(filtered_df.index)
    return fnames


@app.post("/api/get-saliency-images", response_model=List[SaliencyImage])
async def get_saliency_images(payload: api.ImagesPayload):
    payload = api.ImagesPayload(**payload)
    filtered_df = df.loc[payload.image_ids]
    filtered_df['score'] = filtered_df[payload.score_fn]
    return filtered_df.to_dict('records')


@app.get("/api/get-labels", response_model=List[str])
async def get_labels():
    return list(df.label.unique())


@app.get("/api/get-predictions", response_model=List[str])
async def get_predictions():
    return list(df.prediction.unique())


@app.post("/api/bin-scores", response_model=List[Bins])
async def bin_scores(payload: api.ImagesPayload, min_range: int = 0, max_range: int = 1, num_bins:int = 11):
    payload = api.ImagesPayload(**payload)
    filtered_df = df.loc[payload.image_ids]
    scores = filtered_df[payload.score_fn].tolist()
    bins = np.linspace(min_range, max_range, num_bins)
    hist, bin_edges = np.histogram(scores, bins)
    bin_object = [{'x0': bin_edges[i], 'x1': bin_edges[i+1], 'num': num} for i, num in enumerate(list(hist))]
    return bin_object


@app.get("/api/confusion-matrix", response_model=List[ConfusionMatrix])
async def get_confusion_matrix_values(label_filter: str, score_fn: str, n: int = 10):
    if label_filter == '':
        filtered_df = df.loc[df.label != df.prediction]
    else:
        filtered_df = df.loc[(df.label == label_filter) & (df.label != df.prediction)]
    confused_labels = filtered_df.groupby('label').agg('count')\
        .sort_values('image', ascending=False)\
        .index.values.tolist()[:n]
    top_predictions = df.loc[df.label.isin(confused_labels)]\
        .groupby('prediction').agg('count')\
        .sort_values('image', ascending=False)\
        .index.values.tolist()[:n]
    matrix_labels = list(set(top_predictions + confused_labels))
    confusion_df = df.loc[(df.label.isin(matrix_labels)) & (df.prediction.isin(matrix_labels))]
    confusion_matrix = confusion_df.groupby(['label', 'prediction'])\
        .agg(['count', 'mean'])[score_fn]\
        .reset_index().to_dict('records')
    return confusion_matrix


if __name__ == "__main__":
    # This file is not run as __main__ in the uvicorn environment
    args, _ = parser.parse_known_args()
    uvicorn.run("server:app", host='127.0.0.1', port=args.port)
