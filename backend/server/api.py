from typing import *

import numpy as np
from pydantic import BaseModel


class HashableBaseModel(BaseModel):
    def __hash__(self):
        return hash(self.json())

    @classmethod
    def validate(cls, v: np.ndarray):
        return v


class ResultPayload(HashableBaseModel):
    case_study: str
    result_ids: List[str]
    score_fn: str
