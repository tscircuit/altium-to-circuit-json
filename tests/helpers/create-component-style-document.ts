import { parseAltiumSchDoc } from "altiumts"

export function createComponentStyleDocument(
  libraryReference = "CustomDevice",
  designator = "U1",
) {
  return parseAltiumSchDoc(
    [
      "|RECORD=31|CUSTOMX=100|CUSTOMY=100|SIZE1=10|FONTNAME1=Arial",
      `|RECORD=1|LibReference=${libraryReference}|Designator=${designator}|PartCount=1|CurrentPartId=1|Location.X=50|Location.Y=50`,
      "|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=40|Location.Y=50|Name=IN|Designator=1|PinLength=10|Orientation=2|COLOR=16711680",
      "|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=60|Location.Y=50|Name=OUT|Designator=2|PinLength=10|Orientation=0|COLOR=16711680",
      "|RECORD=14|OwnerIndex=1|OwnerPartId=1|Location.X=45|Location.Y=45|Corner.X=55|Corner.Y=55|COLOR=16711680|AREACOLOR=16777215|ISSOLID=T",
      "|RECORD=13|OwnerIndex=1|OwnerPartId=1|Location.X=45|Location.Y=45|Corner.X=55|Corner.Y=55|COLOR=16711680",
      "|RECORD=8|OwnerIndex=1|OwnerPartId=1|Location.X=48|Location.Y=52|RADIUS=1|COLOR=16711680|AREACOLOR=0|ISSOLID=T",
      "|RECORD=7|OwnerIndex=1|OwnerPartId=1|LOCATIONCOUNT=3|X1=50|Y1=50|X2=53|Y2=50|X3=50|Y3=53|COLOR=16711680|AREACOLOR=16711680|ISSOLID=T",
      `|RECORD=34|OwnerIndex=1|OwnerPartId=-1|Location.X=50|Location.Y=58|Text=${designator}|COLOR=8388608`,
      "|RECORD=41|OwnerIndex=1|OwnerPartId=-1|Location.X=50|Location.Y=42|Name=Comment|Text=Device|COLOR=8388608",
      "|RECORD=4|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=53|Text=hidden|ISHIDDEN=T|COLOR=16711680",
      "|RECORD=4|Location.X=20|Location.Y=80|Text=Sheet note|COLOR=16711680",
      "|RECORD=13|Location.X=10|Location.Y=10|Corner.X=20|Corner.Y=10|COLOR=16711680",
      "|RECORD=27|LOCATIONCOUNT=2|X1=20|Y1=50|X2=40|Y2=50",
    ].join("\n"),
  )
}
