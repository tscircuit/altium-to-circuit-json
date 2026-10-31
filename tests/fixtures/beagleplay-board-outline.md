The board contour and Mechanical 1 tracks/arcs are extracted without changing
their coordinates from BeaglePlay's published Altium export:

https://github.com/beagleboard/beagleplay/blob/7a59a98ae27dc4fd9e2bd8975ff90cdb44a366ea/Design/Altium%20Export/BEAGLEPLAYV020_220915.PrjPcb/BEAGLEPLAYV020_220915.brd.PcbDoc

The declared contour repeats its top edge and closes with a diagonal across
the PCB. Mechanical 1 contains the intact perimeter, including duplicate
straight tracks and four 50 mil corner arcs. The fixture retains those
duplicates. Components, routing and unrelated fabrication drawings are omitted.

The expected perimeter is approximately 80 by 80 mm, matching the mechanical
drawing in https://docs.beagleboard.org/boards/beagleplay/03-design.html.
