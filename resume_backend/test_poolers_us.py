import psycopg2
import sys

# Testing US East Pooler
try:
    conn = psycopg2.connect("postgresql://postgres.diunuwabdtdrryulkuqd:%5BJaichandra%40143%5D@aws-0-us-east-1.pooler.supabase.com:6543/postgres")
    print("US EAST POOLER: Connection successful!")
    conn.close()
except Exception as e:
    print(f"US EAST POOLER Failed: {e}")
