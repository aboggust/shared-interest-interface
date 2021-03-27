import argparse
import os
from typing import *

import numpy as np
import pandas as pd
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel

import backend.server.api as api
import backend.server.path_fixes as pf

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
@app.get("/")
def index():
    return RedirectResponse(url=f"{prefix}/index.html")


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

class Bins(BaseModel):
    x0: float
    x1: float
    num: int


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


if __name__ == "__main__":
    # This file is not run as __main__ in the uvicorn environment
    args, _ = parser.parse_known_args()
    uvicorn.run("server:app", host='127.0.0.1', port=args.port)
