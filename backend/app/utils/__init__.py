"""
Utils package
"""

from .database import (
    get_database,
    get_client,
    close_database,
    object_id_to_str,
    str_to_object_id,
    serialize_mongo_doc,
    serialize_mongo_docs,
    create_pagination_pipeline,
    create_text_search_pipeline,
    build_filter_query,
    create_lookup_pipeline,
    unwind_field,
    add_soft_delete_filter,
    add_timestamp_filter,
    check_database_health,
    initialize_database,
    create_indexes,
)

__all__ = [
    "get_database",
    "get_client",
    "close_database",
    "object_id_to_str",
    "str_to_object_id",
    "serialize_mongo_doc",
    "serialize_mongo_docs",
    "create_pagination_pipeline",
    "create_text_search_pipeline",
    "build_filter_query",
    "create_lookup_pipeline",
    "unwind_field",
    "add_soft_delete_filter",
    "add_timestamp_filter",
    "check_database_health",
    "initialize_database",
    "create_indexes",
]
