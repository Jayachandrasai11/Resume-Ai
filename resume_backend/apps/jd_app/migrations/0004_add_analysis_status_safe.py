from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("jd_app", "0003_add_created_by_owner"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE jd_app_jobdescription
              ADD COLUMN IF NOT EXISTS analysis_status varchar(20) NOT NULL DEFAULT 'pending';
            """,
            reverse_sql="""
            ALTER TABLE jd_app_jobdescription
              DROP COLUMN IF EXISTS analysis_status;
            """,
        )
    ]

