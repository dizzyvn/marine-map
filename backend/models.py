"""
SQLAlchemy database models.
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID
import uuid

from database import Base


class Image(Base):
    """Image model for marine creature photos."""

    __tablename__ = "images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, unique=True, nullable=False, index=True)
    path = Column(Text)
    width = Column(Integer)
    height = Column(Integer)
    make = Column(String)
    model = Column(String)
    datetime = Column(DateTime(timezone=True))
    datetimeoriginal = Column(DateTime(timezone=True), index=True)
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    manually_tagged = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self) -> dict:
        """Convert model to dictionary."""
        return {
            "filename": self.filename,
            "path": self.path,
            "width": self.width,
            "height": self.height,
            "make": self.make,
            "model": self.model,
            "datetime": self.datetime.isoformat() if self.datetime else None,
            "datetimeoriginal": self.datetimeoriginal.isoformat() if self.datetimeoriginal else None,
            "latitude": float(self.latitude) if self.latitude else None,
            "longitude": float(self.longitude) if self.longitude else None,
            "manually_tagged": self.manually_tagged,
        }


class Location(Base):
    """Location model for favorite diving/snorkeling spots."""

    __tablename__ = "locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    latitude = Column(Numeric(10, 8), nullable=False)
    longitude = Column(Numeric(11, 8), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self) -> dict:
        """Convert model to dictionary."""
        return {
            "id": str(self.id),
            "name": self.name,
            "latitude": float(self.latitude),
            "longitude": float(self.longitude),
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
