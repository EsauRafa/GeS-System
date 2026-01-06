## 2024-07-25 - Announcing Dynamic Errors for Accessibility
**Learning:** For dynamically appearing error messages, such as after a failed login attempt, simply displaying the message visually is insufficient for screen reader users. They may not be aware that an error has occurred.
**Action:** Always apply the `role="alert"` attribute to the container of the dynamic error message. This standard ARIA attribute ensures that assistive technologies will announce the message text to the user as soon as it appears, providing the critical feedback needed for an accessible user experience.
