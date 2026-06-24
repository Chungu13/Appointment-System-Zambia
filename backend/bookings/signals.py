from django.dispatch import Signal

# Sent by Appointment.save() whenever the status field changes.
# Provides keyword arguments: instance, old_status, new_status, schema_name.
appointment_status_changed = Signal()
