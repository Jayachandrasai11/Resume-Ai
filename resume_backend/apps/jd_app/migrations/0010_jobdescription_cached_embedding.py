from django.db import migrations
from pgvector.django import VectorField


class Migration(migrations.Migration):

    dependencies = [
        ('jd_app', '0009_alter_jobdescription_skills'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobdescription',
            name='cached_embedding',
            field=VectorField(
                blank=True,
                dimensions=384,
                help_text='Cached embedding vector for this job description (generated once, reused on every match)',
                null=True,
            ),
        ),
    ]
