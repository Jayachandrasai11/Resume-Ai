from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_must_reset_password"),
    ]

    operations = [
        migrations.AddField(
            model_name="customuser",
            name="onboarding_completed",
            field=models.BooleanField(default=False),
        ),
    ]
