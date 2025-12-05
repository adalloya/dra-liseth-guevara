from PIL import Image
import os

# Source images
images = [
    "/Users/adalloya/.gemini/antigravity/brain/ebec0353-d7aa-46d0-8f5e-7044aca2a676/uploaded_image_0_1764780011483.jpg",
    "/Users/adalloya/.gemini/antigravity/brain/ebec0353-d7aa-46d0-8f5e-7044aca2a676/uploaded_image_1_1764780011483.jpg",
    "/Users/adalloya/.gemini/antigravity/brain/ebec0353-d7aa-46d0-8f5e-7044aca2a676/uploaded_image_2_1764780011483.jpg",
    "/Users/adalloya/.gemini/antigravity/brain/ebec0353-d7aa-46d0-8f5e-7044aca2a676/uploaded_image_3_1764780011483.jpg",
    "/Users/adalloya/.gemini/antigravity/brain/ebec0353-d7aa-46d0-8f5e-7044aca2a676/uploaded_image_4_1764780011483.jpg"
]

output_dir = "/Users/adalloya/Desktop/APPS"

for i, img_path in enumerate(images):
    try:
        with Image.open(img_path) as img:
            width, height = img.size
            # Calculate split point (middle height)
            mid_height = height // 2
            
            # Crop Top (Before)
            before_img = img.crop((0, 0, width, mid_height))
            before_path = os.path.join(output_dir, f"case{i+1}_before.jpg")
            before_img.save(before_path)
            
            # Crop Bottom (After)
            after_img = img.crop((0, mid_height, width, height))
            after_path = os.path.join(output_dir, f"case{i+1}_after.jpg")
            after_img.save(after_path)
            
            print(f"Processed Case {i+1}: Saved to {before_path} and {after_path}")
            
    except Exception as e:
        print(f"Error processing {img_path}: {e}")
