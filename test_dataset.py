import traceback
import sys
from datasets import load_dataset
try:
    print("Loading PlantVillage...")
    # HF often hosts "plant_village"
    ds = load_dataset("plant_village", name="color")
    print(ds)
except Exception as e:
    print(f"Error loading plant_village: {e}")
    traceback.print_exc()

try:
    print("\nLoading spMohanty/plantvillage...")
    ds2 = load_dataset("spMohanty/PlantVillage-Dataset")
    print(ds2)
except Exception as e:
    print(f"Error loading spMohanty/PlantVillage: {e}")
    traceback.print_exc()
