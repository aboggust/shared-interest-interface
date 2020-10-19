# Saliency Explorer
A tool to explore model behavior by comparing ground truth regions and model explanations.

## Getting Started

From the root:

1. `conda env create -f environment.yml`
2. `conda activate shared-interest`
3. `pip install -e .`
2. `cd client; npm run build`

The distill article is available at `/article` while the main demo is available at `/`.

## Running
To start the server for development, run:

`uvicorn backend.server:app --reload`

For production, run:

`uvicorn backend.server:app`

This will run on a single worker, which should be sufficient for this.

