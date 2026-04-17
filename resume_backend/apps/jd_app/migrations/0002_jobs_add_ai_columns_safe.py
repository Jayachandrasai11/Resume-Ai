from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("jd_app", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE jd_app_jobdescription
              ADD COLUMN IF NOT EXISTS extracted_role varchar(255) NULL;
            ALTER TABLE jd_app_jobdescription
              ADD COLUMN IF NOT EXISTS required_skills jsonb NULL;
            ALTER TABLE jd_app_jobdescription
              ADD COLUMN IF NOT EXISTS preferred_skills jsonb NULL;
            ALTER TABLE jd_app_jobdescription
              ADD COLUMN IF NOT EXISTS min_experience varchar(100) NULL;
            ALTER TABLE jd_app_jobdescription
              ADD COLUMN IF NOT EXISTS experience_years double precision NULL;
            ALTER TABLE jd_app_jobdescription
              ADD COLUMN IF NOT EXISTS salary_range varchar(100) NULL;
            ALTER TABLE jd_app_jobdescription
              ADD COLUMN IF NOT EXISTS location varchar(255) NULL;
            ALTER TABLE jd_app_jobdescription
              ADD COLUMN IF NOT EXISTS employment_type varchar(100) NULL;
            ALTER TABLE jd_app_jobdescription
              ADD COLUMN IF NOT EXISTS responsibilities jsonb NULL;
            ALTER TABLE jd_app_jobdescription
              ADD COLUMN IF NOT EXISTS qualifications jsonb NULL;
            ALTER TABLE jd_app_jobdescription
              ADD COLUMN IF NOT EXISTS analyzed_at timestamptz NULL;
            ALTER TABLE jd_app_jobdescription
              ADD COLUMN IF NOT EXISTS analysis_error text NULL;
            """,
            reverse_sql="""
            ALTER TABLE jd_app_jobdescription DROP COLUMN IF EXISTS analysis_error;
            ALTER TABLE jd_app_jobdescription DROP COLUMN IF EXISTS analyzed_at;
            ALTER TABLE jd_app_jobdescription DROP COLUMN IF EXISTS qualifications;
            ALTER TABLE jd_app_jobdescription DROP COLUMN IF EXISTS responsibilities;
            ALTER TABLE jd_app_jobdescription DROP COLUMN IF EXISTS employment_type;
            ALTER TABLE jd_app_jobdescription DROP COLUMN IF EXISTS location;
            ALTER TABLE jd_app_jobdescription DROP COLUMN IF EXISTS salary_range;
            ALTER TABLE jd_app_jobdescription DROP COLUMN IF EXISTS experience_years;
            ALTER TABLE jd_app_jobdescription DROP COLUMN IF EXISTS min_experience;
            ALTER TABLE jd_app_jobdescription DROP COLUMN IF EXISTS preferred_skills;
            ALTER TABLE jd_app_jobdescription DROP COLUMN IF EXISTS required_skills;
            ALTER TABLE jd_app_jobdescription DROP COLUMN IF EXISTS extracted_role;
            """,
        )
    ]

