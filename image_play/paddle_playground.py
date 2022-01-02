import cv2 
from paddleocr import PaddleOCR,draw_ocr

# Paddleocr supports Chinese, English, French, German, Korean and Japanese.
# You can set the parameter `lang` as `ch`, `en`, `french`, `german`, `korean`, `japan`
# to switch the language model in order.
ocr = PaddleOCR(use_angle_cls=True, lang='en') # need to run only once to download and load model into memory
img_path = './done/20211230094912_1.jpg'
img = cv2.imread(img_path)

result = ocr.ocr(img, cls=True)
for line in result:
    print(line)
