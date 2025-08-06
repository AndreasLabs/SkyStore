"""Type definitions for SkyStore API models."""

from datetime import datetime
from typing import Dict, List, Optional, TypeVar, Generic, Union
from pydantic import BaseModel

T = TypeVar('T')

class RestResult(BaseModel, Generic[T]):
    """Generic REST result wrapper."""
    http_status: int
    success: bool
    message: str
    content: Optional[T]

class Flight(BaseModel):
    """Flight model."""
    uuid: str
    name: str
    description: Optional[str] = None

class Asset(BaseModel):
    """Asset model."""
    uuid: str
    stored_path: str
    owner_uuid: str
    uploader_uuid: str
    flight_uuid: Optional[str] = None
    flight: Optional[Flight] = None
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, str]] = None

class AssetCreate(BaseModel):
    """Asset creation model."""
    stored_path: str
    file_name: str
    file_type: str
    size_bytes: int
    owner_uuid: str
    uploader_uuid: str
    flight_uuid: Optional[str] = None