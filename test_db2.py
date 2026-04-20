import psycopg2
import sys

print("Attempting to connect with password without brackets...")
conn_string_no_brackets = "postgresql://postgres.diunuwabdtdrryulkuqd:Jaichandra%40143@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
try:
    conn = psycopg2.connect(conn_string_no_brackets)
    print("SUCCESS")
    conn.close()
except Exception as e:
    print(f"FAILED: {e}")
