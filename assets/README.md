# Visual asset provenance

medistock-demo.png is the unmodified PNG embedded as medistock-login-logo in the
user-provided MediStock_Mockup_Demo.html reference. Only the PNG bytes were extracted;
the demo's scripts, credentials, synthetic data and antivirus injection were not copied.

The five SVG icons are static renders of Pill, Truck, Boxes, UserRound and LogOut
from the existing pinned lucide-react 1.55.0 package used by the Suppliers portal.
They are not manually drawn and require no runtime dependency in the shell.
LUCIDE-LICENSE preserves the upstream ISC/Feather MIT notices.
The development server exposes exact asset paths, never the demo HTML or arbitrary files.
