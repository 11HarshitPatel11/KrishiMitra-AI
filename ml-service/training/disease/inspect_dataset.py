import os
from PIL import Image
import json

def inspect_dataset(data_dir):
    print("Inspecting Dataset...")
    stats = {}
    total_images = 0
    corrupted_images = []
    unsupported_formats = []
    
    splits = ['train', 'validation', 'test']
    
    for split in splits:
        split_dir = os.path.join(data_dir, split)
        if not os.path.exists(split_dir):
            continue
            
        stats[split] = {}
        for cls in os.listdir(split_dir):
            cls_dir = os.path.join(split_dir, cls)
            if not os.path.isdir(cls_dir):
                continue
                
            stats[split][cls] = 0
            for img_name in os.listdir(cls_dir):
                img_path = os.path.join(cls_dir, img_name)
                total_images += 1
                stats[split][cls] += 1
                
                # Check format and corruption
                try:
                    with Image.open(img_path) as img:
                        img.verify()
                        if img.format not in ['JPEG', 'PNG', 'JPG']:
                            unsupported_formats.append(img_path)
                except Exception:
                    corrupted_images.append(img_path)
                    
    print(f"Total Images: {total_images}")
    print(f"Stats: {json.dumps(stats, indent=2)}")
    print(f"Corrupted Images: {len(corrupted_images)}")
    print(f"Unsupported Formats: {len(unsupported_formats)}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, default="../../datasets/disease")
    args = parser.parse_args()
    inspect_dataset(args.data_dir)
