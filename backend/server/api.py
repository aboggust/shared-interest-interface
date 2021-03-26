from typing import *

import numpy as np
from pydantic import BaseModel


class HashableBaseModel(BaseModel):
    def __hash__(self):
        return hash(self.json())

    @classmethod
    def validate(cls, v: np.ndarray):
        return v


class ImagesPayload(HashableBaseModel):
    case_study: str
    image_ids: List[str]
    score_fn: str

# image, image_shape, mask, mask_shape, si_method:str, topk:int = 5
class BestPredictionPayload(HashableBaseModel):
    image: str
    image_shape: str
    mask: str
    mask_shape: str
    si_method: str
    topk: int