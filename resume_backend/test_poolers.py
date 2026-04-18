import psycopg2
import sys

# Testing Mumbai Pooler
try:
    # Username format for Pooler: postgres.diunuwabdtdrryulkuqd
    conn = psycopg2.connect("postgresql://postgres.diunuwabdtdrryulkuqd:%5BJaichandra%40143%5D@aws-0-ap-south-1.pooler.supabase.com:6543/postgres")
    print("MUMBAI POOLER: Connection successful!")
    conn.close()
except Exception as e:
    print(f"MUMBAI POOLER Failed: {e}")

# Testing Singapore Pooler
try:
    conn = psycopg2.connect("postgresql://postgres.diunuwabdtdrryulkuqd:%5BJaichandra%40143%5D@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres")
    print("SINGAPORE POOLER: Connection successful!")
    conn.close()
except Exception as e:
    print(f"SINGAPORE POOLER Failed: {e}")
