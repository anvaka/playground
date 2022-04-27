# Just one file playground
import cv2 
import numpy as np
import pytesseract
from pytesseract import Output


def getTextFromData(data):
    text = ''
    for i in range(len(data['level'])):
      confidence = float(data['conf'][i])
      if confidence > 90.0:        #TODO -1 in conf means multi-word....
        text += (data["text"][i] + ' ')
      else:
        print ("confidence too low: " + str(confidence) + " for " + data["text"][i])

    return str.strip(text)

def printData(img, filter_kind):
    data = pytesseract.image_to_data(img, lang="eng", config=r'--oem 3 --psm 7', output_type=Output.DICT)
    value = getTextFromData(data)
    cv2.imwrite('./' +filter_kind + '.png', img)
    print (value)

itemLeftOffset = 1252
itemTopOffset = 425
itemRowWidth = 1600
itemRowHeight = 102
itemsOnScreen = 9

img = cv2.imread('done/20211230203141_1.jpg')

x1 = itemLeftOffset
y1 = itemTopOffset + 6 * itemRowHeight

row = img[y1:y1+itemRowHeight, x1:x1 + itemRowWidth]

start = 102 #+ 374 + 191 + 80 + 82 + 89 + 157 + 121 + 85 + 90
end = start + 374 # 87
img = row[40:(30+40), start:end]

cv2.imwrite('./original.png', img)
img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
printData(img, 'original')
cv2.imwrite('./gray.png', img)

for min_value in range(127, 40, -5):
  # ret,thresh1 = cv2.threshold(img,min_value,255,cv2.THRESH_BINARY)
  # printData(thresh1)
  # cv2.imwrite('./thres_binary.png', thresh1)
  ret,thresh2 = cv2.threshold(img,min_value,255,cv2.THRESH_BINARY_INV)
  print("Min value: " + str(min_value))
  printData(thresh2, 'inv_thres_binary_' + str(min_value))
  # cv2.imwrite('./thres_binary_inv.png', thresh2)
  # ret,thresh3 = cv2.threshold(img,min_value,255,cv2.THRESH_TRUNC)
  # printData(thresh3)
  # # cv2.imwrite('./thres_trunc.png', thresh3)
  # ret,thresh4 = cv2.threshold(img,min_value,128,cv2.THRESH_TOZERO)
  # printData(thresh4, 'thres_tozero' + str(min_value) )
  # # cv2.imwrite('./thres_tozero.png', thresh4)
  # ret,thresh5 = cv2.threshold(img,min_value,255,cv2.THRESH_TOZERO_INV)
  # printData(thresh5)
  # cv2.imwrite('./thres_tozero_env.png', thresh5)

# ret,thresh6 = cv2.threshold(img,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)
# printData(thresh6)
# cv2.imwrite('./thres_otsu.png', thresh6)
