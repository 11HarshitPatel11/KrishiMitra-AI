# Machine Learning Training Environment

This directory houses the foundational scripts and artifacts required to train the Crop Prediction logic.

## Reproducibility Guidelines

To ensure the team can safely reproduce environments:

### 1. Requirements
Ensure you are in the project `ml-service` root directory.
Install required numerical and structural packages WITHOUT inflating environments unnecessarily:
```bash
pip install -r requirements.txt
```

### 2. Activate Virtual Environment
Use the existing virtual machine logic previously established before relying on global packages.
- **Windows**: `.\venv\Scripts\activate`
- **Linux/Mac**: `source venv/bin/activate`

### 3. Run Dataset Inspection
Perform standard dataset sanity checks prior to attempting ANY model training logic:
```bash
python training/scripts/inspect_dataset.py
```

### 4. Notebook Exploration (Optional)
If you require interactive visual probing, launch the provided Jupyter framework:
- Ensure you have `jupyter` installed (`pip install jupyter`).
- Spin it up via: `jupyter notebook training/notebooks/01_dataset_exploration.ipynb`

> **Note:** Modeling decisions (dropping values, imputing logic) must only be done in subsequent processing steps. Do NOT arbitrarily modify data blindly.
