# Shared Interest ([Article](http://shared-interest.csail.mit.edu) | [Demo](http://shared-interest.csail.mit.edu/demo))
![Shared interest teaser](./client/src/assets/img/teaser.svg)

A method to explore model behavior by comparing ground truth regions and model explanations.
Check out the [demo](http://shared-interest.csail.mit.edu/demo) to see shared interest applied to 
ImageNet classification and melanoma prediction tasks.
Read the [article](http://shared-interest.csail.mit.edu) presented at VISxAI 2020.

## Getting Started

Before cloning this repo, [install](https://docs.github.com/en/free-pro-team@latest/github/managing-large-files/installing-git-large-file-storage) `git lfs`. When you clone the repo, the data files will automatically download. 

From the root:

1. `conda env create -f environment.yml`
2. `conda activate shared-interest`
3. `pip install -e .`
2. `cd client; npm i; npm run build`

The main demo is available at `/`.

## Running Locally
To start the server for development, run:

`uvicorn backend.server:app --reload`

For production, run:

`uvicorn backend.server:app`

This will run on a single worker, which should be sufficient for this.
By default this will run on `127.0.0.1:8000`.
To change the host or the port, run:

`uvicorn backend.server:app --host <host> --port <port>`

## Creating Data Files
The code in `data/` is used to create the data files consumed by Shared Interest.
To apply it to your own data, models, and explanation methods, modify `data/generate_datasets.py` and `data/explanation_methods.py`.

Once you have created your own data file, you can incorporate it into the interface, by adding it to `backend/server/api/main.py`
and to the case study selection bar in `client/src/ts/etc/selectionOptions.ts`.
