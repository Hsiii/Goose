import cv2
import numpy as np
import os
import json

def process():
    brain_dir = "/Users/hsi/.gemini/antigravity/brain/0791348e-2924-4363-ba1f-8f4a3afbb42b"
    
    # All are exactly 4x4 grid. Resolution of image is 640x640, meaning exactly 160x160 pixels per cell.
    # No heuristic parsing needed. 
    
    files_map = {
        "goose_walk": (os.path.join(brain_dir, "goose_walk_idle_1773651319870.png"), 5, 4),
        "goose_actions": (os.path.join(brain_dir, "goose_actions_1773651338687.png"), 8, 3),
        "goose_reminders": (os.path.join(brain_dir, "goose_reminders_1773651352977.png"), 7, 2)
    }

    frames_json = {}
    i = 0
    
    # Canvas properties
    sheet_w = 2048
    sheet_h = 2048
    sheet = np.zeros((sheet_h, sheet_w, 4), dtype=np.uint8)
    
    curr_x = 0
    curr_y = 0
    
    for category, (filepath, cols, rows) in files_map.items():
        if not os.path.exists(filepath):
            continue
            
        img = cv2.imread(filepath, cv2.IMREAD_UNCHANGED)
        
        # Original images have white background and we want to keep the white goose body
        # Convert to BGR if needed
        if img.shape[2] == 4:
            alpha = img[:,:,3]
            img_bgr = img[:,:,:3]
            mask = alpha < 128
            img_bgr[mask] = [255, 255, 255]
            img = img_bgr

        # Flood fill to find transparent background (Originals have pure white background)
        h, w = img.shape[:2]
        flood_mask = np.zeros((h+2, w+2), np.uint8)
        tolerance = (15, 15, 15)
        flags = 4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8)
        for pt in [(0,0), (w-1, 0), (0, h-1), (w-1, h-1)]:
            cv2.floodFill(img, flood_mask, pt, (0,0,0), tolerance, tolerance, flags)
            
        alpha_mask = cv2.bitwise_not(flood_mask[1:-1, 1:-1])
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        img[:, :, 3] = alpha_mask
        
        # Grid slicing
        cell_w = w // cols
        cell_h = h // rows
        
        # Reset frame counter for each category loop so we have clean names
        frame_idx = 0
        for row in range(rows):
            for col in range(cols):
                # The prompt included text at the top of actions and reminders.
                # Let's crop out the top 20% of any cell which usually contains text
                slice_y = row * cell_h + int(cell_h * 0.20)
                slice_h = int(cell_h * 0.80)
                
                slice_x = col * cell_w
                slice_w = cell_w
                
                sprite = img[slice_y:slice_y+slice_h, slice_x:slice_x+slice_w]
                
                # Center it inside a fixed 128x128 box to keep proportion steady
                canvas = np.zeros((128, 128, 4), dtype=np.uint8)
                
                # Ignore empty frames (check if alpha has any non-zero)
                if cv2.countNonZero(sprite[:,:,3]) < 50:
                    continue
                    
                pad_y = max(0, 128 - sprite.shape[0])
                pad_x = (128 - sprite.shape[1]) // 2
                
                cut_h = min(128, sprite.shape[0])
                cut_w = min(128, sprite.shape[1])
                
                # Stick it at the bottom of the canvas so feet align
                pad_y = max(0, 128 - cut_h - 10) # 10 pixels from bottom floor
                canvas[pad_y:pad_y+cut_h, pad_x:pad_x+cut_w] = sprite[0:cut_h, 0:cut_w]
                
                if curr_x + 128 > sheet_w:
                    curr_x = 0
                    curr_y += 128
                    
                # Paste into sheet
                sheet[curr_y:curr_y+128, curr_x:curr_x+128] = canvas
                
                name = f"{category}_{frame_idx}"
                
                frames_json[name] = {
                    "frame": {"x": curr_x, "y": curr_y, "w": 128, "h": 128},
                    "rotated": False,
                    "trimmed": False,
                    "spriteSourceSize": {"x": 0, "y": 0, "w": 128, "h": 128},
                    "sourceSize": {"w": 128, "h": 128}
                }
                
                frame_idx += 1
                curr_x += 128
                
    cv2.imwrite("/Users/hsi/Documents/Code/Goose/static/assets/goose_spritesheet.png", sheet)
    
    pixi_json = {
        "frames": frames_json,
        "meta": {
            "image": "goose_spritesheet.png",
            "format": "RGBA8888",
            "size": {"w": sheet_w, "h": sheet_h},
            "scale": "1"
        }
    }
    
    with open("/Users/hsi/Documents/Code/Goose/static/assets/goose_spritesheet.json", "w") as f:
        json.dump(pixi_json, f, indent=2)

if __name__ == "__main__":
    process()
