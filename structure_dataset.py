import os
import shutil
import random
from datasets import load_dataset

def preserve_and_structure_dataset():
    print("Loading HuggingFace Split definitions from mohanty/PlantVillage...")
    # 'default' configuration returns just the text paths
    hf_ds = load_dataset('mohanty/PlantVillage', 'default')
    
    train_paths = hf_ds['train']['text']
    test_paths = hf_ds['test']['text']
    
    # Filter only 'color' images since we ONLY need RGB images for the MobileNetV3 pipeline
    color_train_paths = [p for p in train_paths if "raw/color/" in p]
    color_test_paths = [p for p in test_paths if "raw/color/" in p]
    
    # Validation split strategy: 15% of the TRaIN portion, avoiding TEST set leakage. 
    # To maintain leaf grouping, we should ideally shuffle the groups, but HF dataset paths just list images. 
    # Given the constraint to use the training portion:
    random.seed(42)
    random.shuffle(color_train_paths)
    val_size = int(len(color_train_paths) * 0.15)
    color_val_paths = color_train_paths[:val_size]
    color_train_paths = color_train_paths[val_size:]
    
    target_base = "ml-service/datasets/PlantVillage"
    source_base = "temp_pv"
    
    print(f"Train: {len(color_train_paths)}, Validation: {len(color_val_paths)}, Test: {len(color_test_paths)}")
    
    os.makedirs(target_base, exist_ok=True)
    
    splits = {
        'train': color_train_paths,
        'validation': color_val_paths,
        'test': color_test_paths
    }
    
    copied = 0
    missing = 0
    for split_name, paths in splits.items():
        for path in paths:
            # path is e.g. "raw/color/Tomato___Bacterial_spot/img.jpg"
            # Extract class name and file name
            parts = path.strip().split('/')
            if len(parts) < 3:
                continue
            class_name = parts[-2]
            file_name = parts[-1]
            
            src_path = os.path.join(source_base, path.strip())
            dest_dir = os.path.join(target_base, split_name, class_name)
            dest_path = os.path.join(dest_dir, file_name)
            
            if os.path.exists(src_path):
                os.makedirs(dest_dir, exist_ok=True)
                shutil.move(src_path, dest_path)
                copied += 1
            elif os.path.exists(dest_path):
                # Already moved in previous aborted run!
                copied += 1
            else:
                missing += 1
            
            if copied % 5000 == 0 and copied > 0:
                print(f"Relocated {copied} items...")
                
    print(f"Copied {copied} images to {target_base}")
    if missing > 0:
        print(f"Warning: {missing} paths from HuggingFace dataset were not found in source repo!")

if __name__ == "__main__":
    preserve_and_structure_dataset()
