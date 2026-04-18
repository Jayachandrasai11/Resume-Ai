import psycopg2
import sys

try:
    conn = psycopg2.connect("postgresql://postgres:%5BJaichandra%40143%5D@[2406:da1a:6b0:f62a:cf83:7fea:e2d8:2a14]:5432/postgres")
    print("Connection successful!")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
    sys.exit(1)
