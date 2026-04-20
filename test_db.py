import psycopg2
import sys

# Test direct generic pooler URL
conn_string = "postgresql://postgres.diunuwabdtdrryulkuqd:[Jaichandra@143]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

print("Attempting to connect with unquoted password...")
try:
    conn = psycopg2.connect(conn_string)
    print("SUCCESS")
    conn.close()
    sys.exit(0)
except Exception as e:
    print(f"FAILED unquoted: {e}")

print("------------------")
print("Attempting to connect with quoted password...")
conn_string_quoted = "postgresql://postgres.diunuwabdtdrryulkuqd:%5BJaichandra%40143%5D@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
try:
    conn = psycopg2.connect(conn_string_quoted)
    print("SUCCESS")
    conn.close()
except Exception as e:
    print(f"FAILED quoted: {e}")
