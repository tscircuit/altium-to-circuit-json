Reduced from U11 (VSSOP8 footprint, component index 16) in BeaglePlay's native
`BEAGLEPLAYV020_220915.brd.PcbDoc`, from BeagleBoard commit
`7a59a98ae27dc4fd9e2bd8975ff90cdb44a366ea`.

The source archive SHA-256 is
`6b2b29a35e308237891d91f2c0b131653c0a01700ab8e5345e31bed3ddf2101e`.
The PCB file SHA-256 is
`6e8db864c5ce930bcc7302824f3a4a6f25f1a971b399fefe799557e0af707053`.
The fixture retains U11's component record, all 8 pads, their original net names,
and its owned designator text. The component record has no designator field;
the owned text contains `U11`.

Only component/net indexes were rebased and the board contour was cropped around
the footprint. Pad coordinates, geometry, and text were retained. The SVG test
compares the native footprint with the existing Circuit JSON assembly renderer,
which displays the imported source component's name.
