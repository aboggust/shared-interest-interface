from typing import *
from fastapi.testclient import TestClient
from urllib.parse import urlencode
from server import app

client = TestClient(app)

def make_url(baseurl, to_send:Dict[str, Any]):
    return baseurl + "?" + urlencode(to_send)