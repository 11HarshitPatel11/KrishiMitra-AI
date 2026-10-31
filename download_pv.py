import urllib.request
import zipfile
import os
import shutil

zip_url = "https://github.com/spMohanty/PlantVillage-Dataset/archive/refs/heads/master.zip"
zip_path = "plantvillage.zip"
target_dir = "ml-service/datasets/PlantVillage"
temp_dir = "temp_plantvillage"

print(f"Downloading {zip_url}...")
# Just download a few MB to check if it's correct
try:
    urllib.request.urlretrieve(zip_url, zip_path)
    print("Downloaded successfully.")
except Exception as e:
    print("Download failed:", e)
    sys.exit(1)
