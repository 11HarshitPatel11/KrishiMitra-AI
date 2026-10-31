import os
import pandas as pd
import numpy as np
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# EDUCATIONAL EXPLANATIONS
# 1. What preprocessing means: It is the structured preparation of raw data into a mathematically consistent format that machine learning algorithms can safely interpret and process without errors.
# 2. What X represents: The input feature matrix. These are the independent variables (like soil nutrients) the model will observe to make a guess.
# 3. What y represents: The target outcome variable. This is what the model is trying to predict (the crop label).
# 4. What classification means: A supervised machine learning challenge where the objective is to assign new examples to specific categorical groups or buckets (labels).
# 5. Why this is multiclass classification: Because we have more than two possible outcomes (we have exactly 22 distinct crops, not just a binary yes/no prediction).
# 6. Why train/test split is necessary: To simulate real-world conditions. We train the model on one portion of data and hide the rest to genuinely evaluate if the model actually learned patterns or just blindly memorized the training answers.
# 7. Why stratification is used: To ensure both train and test splits hold exactly equal representative ratios of every single crop class, avoiding situations where minority crops randomly end up entirely missing from the test set.
# 8. Why random_state is used: To lock the internal random number generator, forcing the exact same splits every time the script runs (100% reproducibility across all environments).
# 9. Why we are not scaling features yet: Tree-based models (like Random Forests) operate on absolute comparative splits rather than distance-based geometry (unlike KNN/SVM), so they do not mandate normalized numeric scaling natively.
# 10. Why outliers are not automatically deleted: High agricultural variance accurately indicates biological bounds for extreme resilient crops (like demanding astronomical Potassium) and are crucial physical differentiators, not sensor noise.
# 11. What data leakage means: The critical mistake of exposing test-set information to the training workflow, which artificially inflates perceived model accuracy prior to genuinely unknown evaluations.

def validate_data(df, expected_features, target_col):
    """Ensure data precisely matches anticipated strict boundaries."""
    # 1. Expected columns exist
    missing_cols = set(expected_features + [target_col]) - set(df.columns)
    if missing_cols:
        raise ValueError(f"Validation failed: Missing expected columns: {missing_cols}")
    
    # 2. No unexpected missing values
    if df.isnull().sum().sum() > 0:
        raise ValueError("Validation failed: Data contains unexpected null or missing values.")
        
    # 3. All feature columns are numeric
    for col in expected_features:
        if not pd.api.types.is_numeric_dtype(df[col]):
            raise ValueError(f"Validation failed: Feature '{col}' is not numeric.")
            
    # 4. Target is non-empty
    if df[target_col].empty or df[target_col].isnull().all():
        raise ValueError("Validation failed: Target outcome dataset is empty.")
        
    # 5. Number of features is exactly 7
    if len(expected_features) != 7:
        raise ValueError(f"Validation failed: Expected exactly 7 features, got {len(expected_features)}")
        
    # 6. Target contains exactly 22 classes
    num_classes = df[target_col].nunique()
    if num_classes != 22:
        raise ValueError(f"Validation failed: Expected exactly 22 crop classes, found {num_classes}.")
        
    # 7. No infinite numerical values
    if np.isinf(df[expected_features]).sum().sum() > 0:
        raise ValueError("Validation failed: Infinite values detected inside numeric bounds.")
        
    # 8. No accidental feature/target leakage
    if target_col in expected_features:
        raise ValueError("Validation failed: Target variable incorrectly found inside input features matrix (Data Leakage).")

    print("[SUCCESS] Data validated structurally across all parameters.")

def preprocess_and_split(filepath):
    print(f"--- Dataset Preprocessing Workflow ---")
    
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Raw dataset missing at path: {filepath}")
        
    # Explicitly load RAW dataset
    raw_df = pd.read_csv(filepath)
    
    # Generate Processed mapping copy mapping 
    # Mappings: Raw -> Application Space
    COLUMN_MAP = {
        'N': 'nitrogen',
        'P': 'phosphorus',
        'K': 'potassium',
        'temperature': 'temperature',
        'humidity': 'humidity',
        'ph': 'pH',
        'rainfall': 'rainfall',
        'label': 'crop'
    }
    
    processed_df = raw_df.rename(columns=COLUMN_MAP)
    
    # The strictly enforced canonical ordered boundary matching Section 5 of ML Data Contract
    CANONICAL_FEATURES = [
        "nitrogen",
        "phosphorus",
        "potassium",
        "temperature",
        "humidity",
        "pH",
        "rainfall"
    ]
    TARGET_COLUMN = "crop"
    
    # Perform all intensive verification tasks BEFORE separating
    validate_data(processed_df, CANONICAL_FEATURES, TARGET_COLUMN)
    
    # Separation
    X = processed_df[CANONICAL_FEATURES] # 9. Enforcing canonical feature order cleanly
    y_raw = processed_df[TARGET_COLUMN]
    
    # Target Encoding logic (mapping string classes to numerical arrays for future algorithms)
    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    
    # Export class references defensively just in case later models need it
    class_mapping = {int(index): label for index, label in enumerate(le.classes_)}
    
    print("\n--- Feature Extraction ---")
    print(f"X shape: {X.shape}")
    print(f"y shape: {y.shape}")
    print(f"Feature Names exactly ordered: {list(X.columns)}")
    
    print("\n--- Train / Test Split ---")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.20,
        random_state=42, # 100% split reproducibility
        stratify=y       # Balances class distribution
    )
    
    print(f"Training split shape: X={X_train.shape}, y={y_train.shape}")
    print(f"Testing split shape: X={X_test.shape}, y={y_test.shape}")
    
    # Validate stratify execution visually
    train_dist = pd.Series(y_train).value_counts().sort_index()
    test_dist = pd.Series(y_test).value_counts().sort_index()
    
    print(f"\nAll 22 classes exist in train? {len(train_dist) == 22}")
    print(f"All 22 classes exist in test? {len(test_dist) == 22}")
    
    # Quick display showing exact proportional matching
    print("\nSample Train class counts:")
    print(train_dist.head(5))
    print("\nSample Test class counts:")
    print(test_dist.head(5))

    return X_train, X_test, y_train, y_test, class_mapping, le, COLUMN_MAP

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    target_path = os.path.join(current_dir, '..', '..', 'datasets', 'Crop_recommendation.csv')
    
    X_train, X_test, y_train, y_test, class_mapping, le_encoder, column_map = preprocess_and_split(target_path)
    
    print("\nPipeline preprocessing successfully bounded in memory.")
    print("NO files were overwritten. NO automatic CSV processing drops were generated.")
