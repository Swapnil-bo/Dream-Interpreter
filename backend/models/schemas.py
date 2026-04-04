from pydantic import BaseModel, Field
from typing import List

class DreamRequest(BaseModel):
    dream: str = Field(min_length=10, max_length=2000, description="The dream text to interpret")

class Symbol(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    meaning: str = Field(min_length=1, max_length=500)

class DreamResponse(BaseModel):
    jungian: str = Field(min_length=1, description="Jungian analysis")
    freudian: str = Field(min_length=1, description="Freudian analysis")
    symbolic: str = Field(min_length=1, description="Symbolic analysis")
    archetypal: str = Field(min_length=1, description="Archetypal patterns")
    symbols: List[Symbol] = Field(min_length=1, description="Extracted dream symbols")
    mood: str = Field(min_length=1, max_length=50, description="Overall mood label")
    mood_score: float = Field(ge=0.0, le=1.0, description="0.0 dark/disturbing → 1.0 peaceful/positive")
    summary: str = Field(min_length=1, max_length=280, description="One-liner for share card")
    model_config = {
        "json_schema_extra": {
            "example": {
                "jungian": "The shadow self manifests...",
                "mood_score": 0.4,
                "symbols": [{"name": "Water", "meaning": "Unconscious mind"}]
            }
        }
    }