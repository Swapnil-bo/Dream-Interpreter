from pydantic import BaseModel
from typing import List

class DreamRequest(BaseModel):
    dream: str

class Symbol(BaseModel):
    name: str
    meaning: str

class DreamResponse(BaseModel):
    jungian: str
    freudian: str
    symbolic: str
    archetypal: str
    symbols: List[Symbol]
    mood: str
    mood_score: float  # 0.0 (dark/disturbing) to 1.0 (peaceful/positive)
    summary: str       # one-liner for the share card