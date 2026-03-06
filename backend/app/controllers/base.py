"""
Base controller with common functionality
"""

from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from datetime import datetime
from bson import ObjectId
from app.utils.database import get_database, serialize_mongo_doc, serialize_mongo_docs
from app.validators import validate_search_params

class BaseController:
    """Base controller with common CRUD operations"""
    
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        self.db = None
    
    def get_collection(self):
        """Get MongoDB collection"""
        if self.db is None:
            self.db = get_database()
        return self.db[self.collection_name]
    
    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new document"""
        try:
            collection = self.get_collection()
            data["created_at"] = datetime.utcnow()
            data["updated_at"] = datetime.utcnow()
            
            result = await collection.insert_one(data)
            created_doc = await collection.find_one({"_id": result.inserted_id})
            
            return serialize_mongo_doc(created_doc)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create {self.collection_name}: {str(e)}"
            )
    
    async def get_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get document by ID"""
        try:
            if not ObjectId.is_valid(doc_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid ID format"
                )
            
            collection = self.get_collection()
            doc = await collection.find_one({"_id": ObjectId(doc_id)})
            
            if not doc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"{self.collection_name} not found"
                )
            
            return serialize_mongo_doc(doc)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get {self.collection_name}: {str(e)}"
            )
    
    async def update(self, doc_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update document by ID"""
        try:
            if not ObjectId.is_valid(doc_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid ID format"
                )
            
            collection = self.get_collection()
            update_data["updated_at"] = datetime.utcnow()
            
            result = await collection.update_one(
                {"_id": ObjectId(doc_id)},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"{self.collection_name} not found"
                )
            
            updated_doc = await collection.find_one({"_id": ObjectId(doc_id)})
            return serialize_mongo_doc(updated_doc)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update {self.collection_name}: {str(e)}"
            )
    
    async def delete(self, doc_id: str) -> Dict[str, Any]:
        """Delete document by ID"""
        try:
            if not ObjectId.is_valid(doc_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid ID format"
                )
            
            collection = self.get_collection()
            result = await collection.delete_one({"_id": ObjectId(doc_id)})
            
            if result.deleted_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"{self.collection_name} not found"
                )
            
            return {"message": f"{self.collection_name} deleted successfully"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete {self.collection_name}: {str(e)}"
            )
    
    async def list(
        self,
        skip: int = 0,
        limit: int = 20,
        sort_field: str = "created_at",
        sort_direction: int = -1,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """List documents with pagination and filtering"""
        try:
            collection = self.get_collection()
            
            # Build query
            query = filters or {}
            
            # Execute query with pagination
            cursor = collection.find(query).sort(sort_field, sort_direction).skip(skip).limit(limit)
            docs = await cursor.to_list(length=limit)
            
            return serialize_mongo_docs(docs)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list {self.collection_name}: {str(e)}"
            )
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count documents"""
        try:
            collection = self.get_collection()
            query = filters or {}
            return await collection.count_documents(query)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to count {self.collection_name}: {str(e)}"
            )
    
    async def search(
        self,
        search_text: str,
        search_fields: List[str],
        skip: int = 0,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search documents"""
        try:
            collection = self.get_collection()
            
            # Create text search query
            search_query = {
                "$text": {"$search": search_text}
            }
            
            # Execute search
            cursor = collection.find(search_query).sort([("score", {"$meta": "textScore"})]).skip(skip).limit(limit)
            docs = await cursor.to_list(length=limit)
            
            return serialize_mongo_docs(docs)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to search {self.collection_name}: {str(e)}"
            )
    
    async def soft_delete(self, doc_id: str) -> Dict[str, Any]:
        """Soft delete document"""
        return await self.update(doc_id, {"is_deleted": True, "deleted_at": datetime.utcnow()})
    
    async def restore(self, doc_id: str) -> Dict[str, Any]:
        """Restore soft deleted document"""
        return await self.update(doc_id, {"is_deleted": False, "deleted_at": None})

class PaginatedController(BaseController):
    """Controller with enhanced pagination support"""
    
    async def paginated_list(
        self,
        skip: int = 0,
        limit: int = 20,
        sort_field: str = "created_at",
        sort_direction: int = -1,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get paginated list with metadata"""
        try:
            # Validate pagination parameters
            params = validate_search_params({
                "skip": skip,
                "limit": limit,
                "sort_field": sort_field,
                "sort_direction": sort_direction
            })
            
            # Get documents
            docs = await self.list(
                skip=params["skip"],
                limit=params["limit"],
                sort_field=params["sort_field"],
                sort_direction=params["sort_direction"],
                filters=filters
            )
            
            # Get total count
            total = await self.count(filters)
            
            # Calculate pagination metadata
            total_pages = (total + params["limit"] - 1) // params["limit"]
            has_next = params["skip"] + params["limit"] < total
            has_prev = params["skip"] > 0
            
            return {
                "data": docs,
                "pagination": {
                    "skip": params["skip"],
                    "limit": params["limit"],
                    "total": total,
                    "total_pages": total_pages,
                    "has_next": has_next,
                    "has_prev": has_prev,
                    "current_page": params["skip"] // params["limit"] + 1
                }
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get paginated {self.collection_name}: {str(e)}"
            )

class AuthenticatedController(BaseController):
    """Controller with authentication support"""
    
    async def get_by_user_id(self, user_id: str) -> List[Dict[str, Any]]:
        """Get documents by user ID"""
        try:
            collection = self.get_collection()
            cursor = collection.find({"user_id": user_id}).sort("created_at", -1)
            docs = await cursor.to_list(length=None)
            return serialize_mongo_docs(docs)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get {self.collection_name} for user: {str(e)}"
            )
    
    async def check_ownership(self, doc_id: str, user_id: str) -> bool:
        """Check if user owns the document"""
        try:
            doc = await self.get_by_id(doc_id)
            return doc.get("user_id") == user_id or doc.get("posted_by") == user_id
        except HTTPException:
            return False
        except Exception:
            return False
    
    async def ensure_ownership(self, doc_id: str, user_id: str) -> Dict[str, Any]:
        """Ensure user owns the document, raise exception if not"""
        if not await self.check_ownership(doc_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You don't have permission to perform this action"
            )
        return await self.get_by_id(doc_id)

class SearchableController(PaginatedController):
    """Controller with advanced search capabilities"""
    
    async def advanced_search(
        self,
        search_params: Dict[str, Any],
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Advanced search with multiple filters"""
        try:
            collection = self.get_collection()
            
            # Build aggregation pipeline
            pipeline = []
            
            # Match stage for filters
            match_stage = {}
            
            # Text search
            if "search_text" in search_params and "search_fields" in search_params:
                match_stage["$text"] = {"$search": search_params["search_text"]}
            
            # Field filters
            for key, value in search_params.items():
                if key not in ["search_text", "search_fields"] and value is not None:
                    if key.endswith("_in") and isinstance(value, list):
                        field_name = key[:-3]
                        match_stage[field_name] = {"$in": value}
                    elif key.endswith("_nin") and isinstance(value, list):
                        field_name = key[:-4]
                        match_stage[field_name] = {"$nin": value}
                    elif key.endswith("_gte"):
                        field_name = key[:-4]
                        match_stage[field_name] = {"$gte": value}
                    elif key.endswith("_lte"):
                        field_name = key[:-4]
                        match_stage[field_name] = {"$lte": value}
                    else:
                        match_stage[key] = value
            
            if match_stage:
                pipeline.append({"$match": match_stage})
            
            # Add sorting
            sort_field = search_params.get("sort_field", "created_at")
            sort_direction = search_params.get("sort_direction", -1)
            pipeline.append({"$sort": {sort_field: sort_direction}})
            
            # Add pagination
            pipeline.append({"$skip": skip})
            pipeline.append({"$limit": limit})
            
            # Execute aggregation
            cursor = collection.aggregate(pipeline)
            docs = await cursor.to_list(length=limit)
            
            # Get total count
            count_pipeline = pipeline[:-2]  # Remove sort and pagination
            count_pipeline.append({"$count": "total"})
            count_result = await collection.aggregate(count_pipeline).to_list(length=1)
            total = count_result[0]["total"] if count_result else 0
            
            return {
                "data": serialize_mongo_docs(docs),
                "pagination": {
                    "skip": skip,
                    "limit": limit,
                    "total": total,
                    "total_pages": (total + limit - 1) // limit,
                    "has_next": skip + limit < total,
                    "has_prev": skip > 0,
                    "current_page": skip // limit + 1
                }
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to search {self.collection_name}: {str(e)}"
            )
