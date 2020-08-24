from pydantic import BaseModel
import numpy as np
from typing import *

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
