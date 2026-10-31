Reduced from LED1 (component index 395) in BeaglePlay's native
`BEAGLEPLAYV020_220915.brd.PcbDoc`, from BeagleBoard commit
`7a59a98ae27dc4fd9e2bd8975ff90cdb44a366ea`.

Source archive SHA-256:
`6b2b29a35e308237891d91f2c0b131653c0a01700ab8e5345e31bed3ddf2101e`.
PCB file SHA-256:
`6e8db864c5ce930bcc7302824f3a4a6f25f1a971b399fefe799557e0af707053`.

The fixture retains LED1's two pads, their net names, owned text, and the actual
top-layer region and fill between its pads. Both have `KEEPOUT=TRUE`; the region
also has `REGIONKIND=COPPER`.
Only component/net indexes were rebased and the board contour was cropped around
the footprint. The source region's coordinates and keepout restrictions were not
changed. This restriction geometry must not become a physical copper pour.
