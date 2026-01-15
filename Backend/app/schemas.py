from pydantic import BaseModel
from typing import Optional

class ProjectOut(BaseModel):
    id: int
    name: str
    image_url: str
    time_span: str
    description: Optional[str]
    position: Optional[str]

    class Config:
        from_attributes = True