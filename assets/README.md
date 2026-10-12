# Visual asset provenance

medistock-demo.png is the unmodified PNG embedded as medistock-login-logo in the
user-provided MediStock_Mockup_Demo.html reference. Only the PNG bytes were extracted;
the demo's scripts, credentials, synthetic data and antivirus injection were not copied.

The six SVG icons are static renders of Pill, Truck, Boxes, UserRound, LogOut and LayoutDashboard
from the existing pinned lucide-react 1.55.0 package used by the Suppliers portal.
They are not manually drawn and require no runtime dependency in the shell.
LUCIDE-LICENSE preserves the upstream ISC/Feather MIT notices.
The development server exposes exact asset paths, never the demo HTML or arbitrary files.
Bell, RefreshCw and the two pagination chevrons are static lucide-static 1.55.0 SVG
assets from its npm package, preserving the upstream paths and license notices.
