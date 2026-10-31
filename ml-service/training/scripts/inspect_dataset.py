import os
import pandas as pd
import numpy as np

# EDUCATIONAL COMMENTS:
# Pandas: A powerful data manipulation library that allows us to load, inspect, and filter structural tabular data seamlessly.
# NumPy: A high-performance mathematical library underneath Pandas for fast vectorized operations on numeric data structures. 
# X/features: The independent variables (n, p, k, temperature, etc.) used to predict outcomes.
# y/target: The dependent variable (crop label) that the machine learning algorithm will try to predict.
# dataset inspection: Crucial preliminary step to verify data health (like checking duplicate rows, null values, standard ranges) before trusting automated mathematical inferences.
# raw vs processed data: Raw data must remain immutable and untouched because modifying the original data introduces untrackable baseline bugs. Processed data is mathematically altered later during a traceable pipeline script execution.

def inspect_dataset(file_path):
    print(f"--- Dataset Inspection ---")
    print(f"1. Dataset path: {file_path}")
    
    if not os.path.exists(file_path):
        print("\nERROR: Dataset file not found.")
        print("Please ensure 'Crop_recommendation.csv' exists in 'ml-service/datasets/' before proceeding.")
        return

    # Load dataset
    df = pd.read_csv(file_path)

    # 2 & 3. Shape
    rows, cols = df.shape
    print(f"2. Number of rows: {rows}")
    print(f"3. Number of columns: {cols}")

    # 4. Column Names
    print(f"\n4. Column names:")
    print(df.columns.tolist())

    # 5. Data Types
    print(f"\n5. Data types:")
    print(df.dtypes)

    # 6. First five rows
    print(f"\n6. First five rows:")
    print(df.head())

    # 7. Missing values
    print(f"\n7. Missing values per column:")
    print(df.isnull().sum())

    # 8. Duplicate rows
    duplicates = df.duplicated().sum()
    print(f"\n8. Duplicate row count: {duplicates}")

    # 9. Numeric summary & Min/Max
    print(f"\n9 & 12. Numeric summary statistics (Min, Max, Mean, etc):")
    # include='number' specifies only numerical values
    print(df.describe(include=[np.number]))

    # Target introspection (assuming a column like 'label' or 'crop')
    target_col = [col for col in df.columns if col.lower() in ('label', 'crop', 'target')]
    if target_col:
        target = target_col[-1]
        
        # 10. Unique Crop labels
        unique_crops = df[target].unique()
        print(f"\n10. Unique '{target}' labels ({len(unique_crops)} total):")
        print(list(unique_crops))
        
        # 11. Samples per crop
        print(f"\n11. Number of samples per '{target}' class:")
        print(df[target].value_counts())
    else:
        print("\nNote: Standard target/label/crop column not identified natively by name.")

    print("\n--- Inspection Complete ---")
    print("Action Item: Review the results to answer critical ML constraints (shape, missing stats, alignment mapping).")
    print("DO NOT blindly process data or train models until health metrics are satisfied.")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    target_path = os.path.join(current_dir, '..', '..', 'datasets', 'Crop_recommendation.csv')
    
    inspect_dataset(target_path)
