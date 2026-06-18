#!/usr/bin/env python
import os
import sys
import argparse
import json
from typing import Optional

# Asegurar importaciones correctas de los módulos locales
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
sys.path.append(os.path.join(current_dir, "app"))

from app.services.supabase_service import supabase_service
from app.services.rag_manager import rag_manager

def handle_create_category(args):
    """Creates a new category in Supabase."""
    print(f"Creating category: '{args.name}'...")
    try:
        category = supabase_service.create_category(args.name, args.description)
        print(f"Success! Category created: {json.dumps(category, indent=2)}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

def handle_list_categories(args):
    """Lists all categories."""
    print("Fetching categories...")
    try:
        categories = supabase_service.list_categories()
        if not categories:
            print("No categories found.")
            return
        for cat in categories:
            print(f"- [{cat['id']}] {cat['name']}: {cat.get('description') or 'No description'}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

def handle_ingest(args):
    """Ingests text content or file content into Supabase."""
    content = ""
    if args.file:
        if not os.path.exists(args.file):
            print(f"Error: File '{args.file}' does not exist.", file=sys.stderr)
            sys.exit(1)
        with open(args.file, "r", encoding="utf-8") as f:
            content = f.read()
        print(f"Read {len(content)} characters from file '{args.file}'.")
    elif args.text:
        content = args.text
    else:
        print("Error: You must specify either --text or --file to ingest.", file=sys.stderr)
        sys.exit(1)

    # Convertir metadata de string JSON a diccionario si se provee
    metadata = {}
    if args.metadata:
        try:
            metadata = json.loads(args.metadata)
        except json.JSONDecodeError as e:
            print(f"Error parsing metadata JSON: {e}", file=sys.stderr)
            sys.exit(1)

    print(f"Ingesting into category '{args.category}'...")
    try:
        result = rag_manager.ingest_document(
            category_name=args.category,
            content=content,
            metadata=metadata
        )
        print("Success! Chunk successfully ingested and saved:")
        print(f"ID: {result['id']}")
        print(f"Category: {args.category} (ID: {result['category_id']})")
        print(f"Content snippet: '{result['content'][:60]}...'")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

def handle_search(args):
    """Performs semantic similarity vector search."""
    print(f"Searching database for query: '{args.query}'...")
    try:
        results = rag_manager.search_similar_documents(
            query=args.query,
            category_name=args.category,
            match_threshold=args.threshold,
            match_count=args.limit
        )
        if not results:
            print("No matching documents found above the threshold.")
            return
        
        print(f"\nFound {len(results)} matching chunks:\n" + "="*50)
        for i, res in enumerate(results, start=1):
            print(f"{i}. Similarity: {res['similarity']:.4f} | ID: {res['id']}")
            print(f"Content:\n{res['content']}")
            if res.get("metadata"):
                print(f"Metadata: {json.dumps(res['metadata'])}")
            print("="*50)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

def main():
    parser = argparse.ArgumentParser(
        description="Backoffice CLI Administrator to manage Supabase RAG system."
    )
    subparsers = parser.add_subparsers(dest="command", required=True, help="Administrator command to run")

    # Command: create-category
    parser_create_cat = subparsers.add_parser("create-category", help="Create a new information category")
    parser_create_cat.add_argument("--name", "-n", required=True, help="Name of the category (e.g. experience)")
    parser_create_cat.add_argument("--description", "-d", help="Description of what this category stores")
    parser_create_cat.set_defaults(func=handle_create_category)

    # Command: list-categories
    parser_list_cat = subparsers.add_parser("list-categories", help="List all categories")
    parser_list_cat.set_defaults(func=handle_list_categories)

    # Command: ingest
    parser_ingest = subparsers.add_parser("ingest", help="Ingest and embed document content")
    parser_ingest.add_argument("--category", "-c", required=True, help="Category name (e.g. projects)")
    group = parser_ingest.add_mutually_exclusive_group(required=True)
    group.add_argument("--text", "-t", help="Raw text string to ingest")
    group.add_argument("--file", "-f", help="Path to text file containing document content")
    parser_ingest.add_argument("--metadata", "-m", help="JSON string representing metadata (e.g. '{\"url\": \"http://example.com\"}')")
    parser_ingest.set_defaults(func=handle_ingest)

    # Command: search
    parser_search = subparsers.add_parser("search", help="Perform vector semantic search")
    parser_search.add_argument("query", help="Query string to search for")
    parser_search.add_argument("--category", "-c", help="Filter search by category name")
    parser_search.add_argument("--threshold", "-t", type=float, default=0.4, help="Similarity threshold (0.0 to 1.0, default: 0.4)")
    parser_search.add_argument("--limit", "-l", type=int, default=3, help="Max number of results to return (default: 3)")
    parser_search.set_defaults(func=handle_search)

    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
