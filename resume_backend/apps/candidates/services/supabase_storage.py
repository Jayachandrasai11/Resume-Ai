import os
import logging
from supabase import create_client, Client
from django.conf import settings

logger = logging.getLogger(__name__)

class SupabaseStorageService:
    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_KEY
        self.bucket = settings.SUPABASE_BUCKET
        self.client: Client = None

        if self.url and self.key:
            try:
                self.client = create_client(self.url, self.key)
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")

    def upload_file(self, file_path, destination_path, content_type="application/pdf"):
        """
        Uploads a file to Supabase storage bucket.
        :param file_path: Path to the local file
        :param destination_path: Where to store in the bucket (e.g. 'resumes/resume.pdf')
        :param content_type: MIME type
        :return: Public URL of the uploaded file
        """
        if not self.client:
            raise Exception("Supabase client not initialized")

        try:
            with open(file_path, 'rb') as f:
                self.client.storage.from_(self.bucket).upload(
                    path=destination_path,
                    file=f,
                    file_options={"content-type": content_type, "x-upsert": "true"}
                )
            
            # Get public URL
            response = self.client.storage.from_(self.bucket).get_public_url(destination_path)
            return response
        except Exception as e:
            logger.error(f"Supabase upload failed: {e}")
            raise e

    def upload_binary(self, binary_data, destination_path, content_type="application/pdf"):
        """Upload binary data directly without a local file."""
        if not self.client:
             raise Exception("Supabase client not initialized")
             
        try:
            self.client.storage.from_(self.bucket).upload(
                path=destination_path,
                file=binary_data,
                file_options={"content-type": content_type, "x-upsert": "true"}
            )
            return self.client.storage.from_(self.bucket).get_public_url(destination_path)
        except Exception as e:
            logger.error(f"Supabase binary upload failed: {e}")
            raise e

storage_service = SupabaseStorageService()
