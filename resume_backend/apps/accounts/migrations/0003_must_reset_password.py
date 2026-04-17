from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_userpreference"),
    ]

    operations = [
        migrations.AddField(
            model_name="customuser",
            name="must_reset_password",
            field=models.BooleanField(default=False),
        ),
    ]

