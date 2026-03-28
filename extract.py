import cv2
import numpy as np
import os
import glob

def process_image(img_path, out_dir, img_name):
    print(f"Processing {img_name}")
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img.shape[2] == 4:
        # Convert transparent to white
        alpha = img[:,:,3]
        img_bgr = img[:,:,:3]
        bg = np.ones_like(img_bgr, dtype=np.uint8) * 255
        mask = (alpha > 128)[:, :, None]
        img = np.where(mask, img_bgr, bg)
    
    # grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # threshold - the background is white, so anything not white is the sprite
    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
    
    # find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # output each contour bounding box that is reasonably large
    os.makedirs(out_dir, exist_ok=True)
    count = 0
    
    # sort contours by y, then x
    boxes = [cv2.boundingRect(c) for c in contours]
    # filter out small noise and probably text
    boxes = [b for b in boxes if b[2] > 20 and b[3] > 20]
    
    boxes.sort(key=lambda b: (b[1] // 100, b[0]))
    
    for (x, y, w, h) in boxes:
        # crop
        crop = img[y:y+h, x:x+w]
        out_path = os.path.join(out_dir, f"{img_name}_{count}.png")
        cv2.imwrite(out_path, crop)
        count += 1
    
    print(f"Extracted {count} sprites from {img_name}")

if __name__ == "__main__":
    brain_dir = "/Users/hsi/.gemini/antigravity/brain/0791348e-2924-4363-ba1f-8f4a3afbb42b"
    files = glob.glob(os.path.join(brain_dir, "*.png"))
    for f in files:
        name = os.path.basename(f).split(".")[0]
        process_image(f, os.path.join(brain_dir, "extracted"), name)
