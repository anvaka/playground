import cv2 
import re
import numpy as np
import pytesseract
from pytesseract import Output

pytesseract.pytesseract.tesseract_cmd = '/usr/local/bin/tesseract'

itemLeftOffset = 1252
itemTopOffset = 425
itemRowWidth = 1600
itemRowHeight = 102
itemsOnScreen = 9

price_pattern = re.compile(r"^\$?(([1-9]\d{0,2}(,\d{3})*)|0)?\.\d{1,2}$")
keys = ("name", "price", "tier", "GS", "gem", "perk", "rarity", "avail", "owned", "time", "location")
t_config = {
    'name': r'--oem 3 --psm 7',
    'price': r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789.,',
    'avail': r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789.,',
    'time': r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789DdHhMmSs',
}

# These are dimensions in the table:
rowComponents = (
  102, # name (ICON)
  374, # Price
  191, # Tier
  80, # G.S
  82, # Gem
  89, # Perk
  157, # Rarity
  121, # Avail
  85, # Owned
  90, # Time
  87  # Location
)

def displayImage(img):
    cv2.destroyAllWindows()
    cv2.imshow('image', img)
    cv2.waitKey(0)

def getRow(img, x1, y1, x2, y2):
    return img[y1:y2, x1:x2]

def getTextFromData(data):
    text = ''
    for i in range(len(data['level'])):
      confidence = float(data['conf'][i])
      if confidence > 90.0:        #TODO -1 in conf means multi-word....
        text += (data["text"][i] + ' ')

    return str.strip(text)

def try_extract(img, save_to, key, extract_fn):
    for min_value in range(127, 40, -5):
        processed = extract_fn(img, min_value)
        data = pytesseract.image_to_data(processed, lang="eng", config=t_config[key], output_type=Output.DICT)
        value = getTextFromData(data)

        if value != '':
            save_to[key] = value
            return True

    return False

def extract_text_from_row(row):
    i = 1
    offset = 0
    start = rowComponents[0]
    obj = {}
    row = cv2.cvtColor(row, cv2.COLOR_BGR2GRAY)
    while i < len(rowComponents):
        offset = rowComponents[i]
        end = start + offset
        current_key = keys[i - 1]
        i += 1
        if not current_key in t_config:
            start = end
            continue

        img = row[40:(30+40), start:end]
        start = end

        # First, let's try the regular image
        data = pytesseract.image_to_data(img, lang="eng", config=t_config[current_key], output_type=Output.DICT)
        value = getTextFromData(data)
        if value != '':
            obj[current_key] = value
            continue

        if try_extract(img, obj, current_key, lambda img, min_value: cv2.threshold(img, min_value, 255, cv2.THRESH_BINARY_INV)[1]):
            continue

        # Other things to try:
        # if not (
        #     # try_extract(img, obj, current_key, lambda img: cv2.threshold(img,127,255,cv2.THRESH_BINARY)[1]) or
        #     try_extract(img, obj, current_key, lambda img, min_value: cv2.threshold(img, min_value, 255, cv2.THRESH_BINARY_INV)[1])
        #     # try_extract(img, obj, current_key, lambda img: cv2.threshold(img,127,255,cv2.THRESH_TRUNC)[1]) or
        #     # try_extract(img, obj, current_key, lambda img: cv2.threshold(img,127,255,cv2.THRESH_TOZERO)[1]) or
        #     # try_extract(img, obj, current_key, lambda img: cv2.threshold(img,127,255,cv2.THRESH_TOZERO_INV)[1]) or
        #     # try_extract(img, obj, current_key, lambda x: cv2.threshold(x,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)[1])
        # ):
        if current_key == 'name':
            return None

        # if try_extract(img, obj, current_key, lambda img, min_value: cv2.threshold(img,min_value,255,cv2.THRESH_TOZERO)[1]):
        #     continue

        # cv2.imwrite('./fail.png', img)
        print("Could not process value for " + current_key + "; Ignoring.")

    return obj

def get_image_data(input_file):
    img = cv2.imread(input_file)
    x1 = itemLeftOffset
    y1 = itemTopOffset
    rowsData = []

    for rank in range(itemsOnScreen):
        row = getRow(img, x1, y1, x1 + itemRowWidth, y1 + itemRowHeight)
        print("processing row " + str(rank))
        rowData = extract_text_from_row(row)
        y1 += itemRowHeight
        if not rowData is None:
            rowData['rank'] = rank + 1
            rowsData.append(rowData)
    
    return rowsData
