from django.db import migrations


class Migration(migrations.Migration):
    """
    Rename the waitlist index to comply with Django's 30-char name limit.
    Uses conditional SQL so it's safe whether the old name exists or not.
    """

    dependencies = [
        ("bookings", "0004_appointmenthistory_appointment_updated_at_and_more"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM pg_indexes
                            WHERE indexname = 'waitlist_service_date_active_idx'
                        ) THEN
                            ALTER INDEX waitlist_service_date_active_idx
                            RENAME TO wl_svc_date_active_idx;
                        END IF;
                    END $$;
                    """,
                    reverse_sql="""
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM pg_indexes
                            WHERE indexname = 'wl_svc_date_active_idx'
                        ) THEN
                            ALTER INDEX wl_svc_date_active_idx
                            RENAME TO waitlist_service_date_active_idx;
                        END IF;
                    END $$;
                    """,
                )
            ],
            state_operations=[],
        )
    ]
