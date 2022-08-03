import paho.mqtt.publish as publish
import json
import base64

# f = open("mqtt.png", "rb")
filecontent = ""
# base64.b64encode(filecontent)
# with open("mqtt.png", "rb") as image_file:
# filecontent = base64.b64encode(image_file.read())
# byteArr = bytearray(filecontent)
# byteArr = "haha"
message = {"sensor1": 25.5, "sensor2": 10}
string = {"id_hardware": "2", "salinitas": "30",
          "ph": "7", "suhu": "33", "id_kolam": "1"}
data_out = json.dumps(string)

publish.single('/Pengabdian/dataKolam', data_out, qos=0,
               hostname='broker.hivemq.com')
# publish.single('/esp32camSensor', data_out, qos=0,
#                hostname='192.168.117.202')
