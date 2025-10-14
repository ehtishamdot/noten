#!/usr/bin/env python3
"""
Create the new granular database schema
"""
import asyncio
from database.connection import engine
from database.models import Base
from database.models_v2 import User, Case, Exercise, Cue, DocumentationExample, CPTCode, Feedback

async def create_tables():
    """Create all tables"""
    print("Creating new database schema...")
    
    async with engine.begin() as conn:
        # Drop all tables first (BE CAREFUL!)
        # await conn.run_sync(Base.metadata.drop_all)
        # print("Dropped existing tables")
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Created all tables successfully!")
        
        # Print table names
        print("\nTables created:")
        for table in Base.metadata.sorted_tables:
            print(f"  - {table.name}")

if __name__ == "__main__":
    asyncio.run(create_tables())
