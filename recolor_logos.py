from PIL import Image
import numpy as np
import os

def process_image(input_path, output_path, target_color_type):
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)

    # Extract channels
    r, g, b, a = data.T

    # Define color thresholds
    # Gray is roughly equal R, G, B
    # Red is high R, low G, B
    # Blue is high B, low R, G
    
    # Create masks
    # Gray mask: R, G, B are close to each other
    gray_mask = (np.abs(r.astype(int) - g.astype(int)) < 30) & \
                (np.abs(g.astype(int) - b.astype(int)) < 30) & \
                (a > 50) # Ensure it's not transparent
    
    # Specific color mask (Red or Blue)
    if target_color_type == 'red':
        # Loya: Red text
        color_mask = (r > g + 50) & (r > b + 50) & (a > 50)
    elif target_color_type == 'blue':
        # Funesma: Blue text
        color_mask = (b > r + 20) & (b > g + 20) & (a > 50)
    
    # Apply changes
    # Turn colored part to WHITE (255, 255, 255)
    data[..., 0][color_mask.T] = 255
    data[..., 1][color_mask.T] = 255
    data[..., 2][color_mask.T] = 255
    
    # Turn gray part to LIGHT GRAY (180, 180, 180) for dark background visibility
    # The original gray might be too dark for a black background
    data[..., 0][gray_mask.T] = 180
    data[..., 1][gray_mask.T] = 180
    data[..., 2][gray_mask.T] = 180

    # Save
    new_img = Image.fromarray(data)
    new_img.save(output_path)
    print(f"Processed {input_path} -> {output_path}")

# Paths
base_dir = "/Users/adalloya/.gemini/antigravity/brain/37e95c3a-a3c8-45b1-97cf-de2db1a3f1aa"
output_dir = "/Users/adalloya/Desktop/APPS/manufacturing-b2b/images"

# Loya (Red)
process_image(
    f"{base_dir}/uploaded_image_0_1764879951063.png",
    f"{output_dir}/loya_logo_white.png",
    'red'
)

# Funesma (Blue)
process_image(
    f"{base_dir}/uploaded_image_1_1764879951063.png",
    f"{output_dir}/funesma_logo_white.png",
    'blue'
)
