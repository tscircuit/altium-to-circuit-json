Reduced from `BeagleBone_Black_RevB4.PcbDoc` in the BeagleBone Black A5B Altium
archive, whose SHA-256 is
`7ff2ca881779f51b9fcb83e041bd06125fc2cb91ba5111c8d360b9df1a651413`.
The PCB file SHA-256 is
`c92c3da1d9d5a0017331fa7208d8f0a0aaa441c6c696b1c422b97578a132948c`.

The fixture retains the original board record, including its legacy six-layer
copper stack and modern mechanical-only records. It selects one native power
polygon per copper layer and three original same-net vias inside those polygons.
Their contours, positions, and net names are unchanged; net indexes are rebased.

Polygon layer references use the names stored in the board's copper stack:
`TOP`, `LYR2_GND`, `LYR3`, `LYR4`, `LYR5_PWR`, and `BOTTOM`. This exposes the
missing inner layers as omitted copper in six SVG comparisons. The separate
legacy-stack regression retains the original `MID1`–`MID4` ordinal case, which
throws before the fix. Neither repro contains a production workaround.
